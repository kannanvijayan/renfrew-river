use futures;
use crate::{
  gpu::{
    GpuDevice,
    GpuMapBuffer,
    GpuSeqBuffer,
    GpuBufferOptions,
    compute::{
      InitializeElevationsParams,
      initialize_elevations,

      mini_elevations,

      InitializeAnimalsParams,
      initialize_animals,
    },
  },
  world::{
    CellCoord,
    WorldDims,
    VecMap,
    TerrainElevation,
    TerrainElevationValueType,
    AnimalId,
    AnimalData,
  },
  game::constants,
};

/**
 * Parameters to initialize a GpuWorld.
 */
pub(crate) struct GpuWorldParams {
  pub(crate) world_dims: WorldDims,
  pub(crate) rand_seed: u64,
}

/**
 * The world state inside the GPU.
 */
pub(crate) struct GpuWorld {
  device: GpuDevice,

  world_dims: WorldDims,
  rand_seed: u64,

  // The terrain map.
  elevation_map: GpuMapBuffer<TerrainElevation>,

  // The list of animal entities.
  animals_list: GpuSeqBuffer<AnimalData>,

  // Map from tiles to animals.
  animals_map: GpuMapBuffer<AnimalId>,
}
impl GpuWorld {
  pub(crate) fn new(init_params: GpuWorldParams) -> GpuWorld {
    let GpuWorldParams { world_dims, rand_seed } = init_params;
    let device = futures::executor::block_on(GpuDevice::new());
    let elevation_map = GpuMapBuffer::new(
      &device,
      world_dims,
      GpuBufferOptions::empty()
        .with_label("ElevationMap")
        .with_storage(true)
        .with_copy_src(true)
    );
    let animals_list = GpuSeqBuffer::new(
      &device,
      constants::MAX_ANIMALS,
      GpuBufferOptions::empty()
        .with_label("AnimalsList")
        .with_storage(true)
        .with_copy_src(true)
    );
    let animals_map = GpuMapBuffer::new(
      &device,
      world_dims,
      GpuBufferOptions::empty()
        .with_label("AnimalsMap")
        .with_storage(true)
        .with_copy_src(true)
    );
    GpuWorld {
      device,
      world_dims,
      rand_seed,
      elevation_map,
      animals_list,
      animals_map,
    }
  }

  pub(crate) fn init_elevations(&self) {
    let params = InitializeElevationsParams {
      world_dims: self.world_dims,
      seed: self.rand_seed as u32,
    };
    futures::executor::block_on(async {
      initialize_elevations(
        &self.device,
        params,
        &self.elevation_map
      ).await
    });
  }

  pub(crate) fn init_animals(&self) {
    let params = InitializeAnimalsParams {
      world_dims: self.world_dims,
      rand_seed: self.rand_seed as u32,
    };
    futures::executor::block_on(async {
      initialize_animals(
        &self.device,
        params,
        &self.animals_list,
        &self.animals_map,
      ).await
    });
  }

  pub(crate) fn read_elevation_values(&self, top_left: CellCoord, area: WorldDims)
    -> VecMap<TerrainElevationValueType>
  {
    futures::executor::block_on(async {
      let out_buf = self.elevation_map.read_mappable_area_copy(
        &self.device,
        top_left,
        area,
      ).await;
      out_buf.cast_as_native_type().to_vec_map().await
    })
  }

  pub(crate) fn read_animal_ids(&self, top_left: CellCoord, area: WorldDims)
    -> VecMap<AnimalId>
  {
    futures::executor::block_on(async {
      let out_buf = self.animals_map.read_mappable_area_copy(
        &self.device,
        top_left,
        area,
      ).await;
      out_buf.to_vec_map().await
    })
  }

  pub(crate) fn mini_elevation_values(&self, mini_area: WorldDims)
    -> VecMap<TerrainElevationValueType>
  {
    let mini_buffer = GpuMapBuffer::new(
      &self.device,
      mini_area,
      GpuBufferOptions::empty()
        .with_label("MiniElevationsBuffer")
        .with_copy_dst(true)
        .with_map_read(true)
    );
    futures::executor::block_on(async {
      mini_elevations(
        &self.device,
        &self.elevation_map,
        &mini_buffer,
      ).await;
      mini_buffer.cast_as_native_type().to_vec_map().await
    })
  }

  pub(crate) fn read_animals_entity_data(&self) -> Vec<AnimalData> {
    futures::executor::block_on(async {
      let out_buf = self.animals_list.read_mappable_subseq_copy(
        &self.device,
        0,
        self.animals_list.length(),
      ).await;
      out_buf.to_vec().await
    })
  }
}