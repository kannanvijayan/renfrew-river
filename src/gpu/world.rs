use futures;
use crate::{
  gpu::{
    GpuDevice,
    GpuMapBuffer,
    GpuSeqBuffer,
    GpuBufferOptions,
    compute::{
      initialize_elevations,
      elevations_minimap,
      initialize_animals,
      compute_downhill_movement,
      resolve_animal_move_conflicts,
      apply_animal_moves,
    },
  },
  world::{
    CellCoord,
    WorldDims,
    VecMap,
    Elevation,
    ElevationValueType,
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

  _world_dims: WorldDims,
  rand_seed: u64,

  // The terrain map.
  elevation_map: GpuMapBuffer<Elevation>,

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
      _world_dims: world_dims,
      rand_seed,
      elevation_map,
      animals_list,
      animals_map,
    }
  }

  pub(crate) fn init_elevations(&self) {
    futures::executor::block_on(async {
      initialize_elevations(
        &self.device,
        self.rand_seed as u32,
        &self.elevation_map
      ).await
    });
  }

  pub(crate) fn init_animals(&self) {
    futures::executor::block_on(async {
      initialize_animals(
        &self.device,
        self.rand_seed as u32,
        &self.animals_list,
        &self.animals_map,
      ).await;
    });
    self.move_animals();
  }

  pub(crate) fn move_animals(&self) {
    let buf = futures::executor::block_on(async {
      let target_positions_buffer = compute_downhill_movement(
        &self.device,
        &self.elevation_map,
        &self.animals_list,
      ).await;

      // KVIJ TODO: Remove this.
      /*
      let cur_animal_data =
        self.animals_list
          .read_mappable_subseq_copy(&self.device, 0, 16).await
          .to_vec().await;
      for animal in cur_animal_data {
        log::info!("XXXXX animal current={:?}", animal.position);
      }

      let animal_target_data =
        target_positions_buffer
          .read_mappable_subseq_copy(&self.device, 0, 16).await
          .to_vec().await;
      for target in animal_target_data {
        log::info!("XXXXX animal target={:?}", target);
      }
      */

      let conflicts_map_buffer = resolve_animal_move_conflicts(
        &self.device,
        &self.animals_list,
        &self.animals_map,
        &target_positions_buffer,
      ).await;

      // KVIJ TODO: Remove this.
      /*
      let animal_target_data =
        target_positions_buffer
          .read_mappable_subseq_copy(&self.device, 0, 16).await
          .to_vec().await;
      for target in animal_target_data {
        log::info!("XXXXX animal resolved={:?}", target);
      }
      */

      apply_animal_moves(
        &self.device,
        &target_positions_buffer,
        &conflicts_map_buffer,
        &self.animals_list,
        &self.animals_map,
      ).await;

      // KVIJ TODO: Remove this.
      /*
       * Dump the state of the animals after the move.
       *
      let cur_animal_data =
        self.animals_list
          .read_mappable_subseq_copy(&self.device, 0, 16).await
          .to_vec().await;
      for animal in cur_animal_data {
        log::info!("XXXXX animal after={:?}", animal.position);
      }
      */
    });
  }

  pub(crate) fn read_elevation_values(&self, top_left: CellCoord, area: WorldDims)
    -> VecMap<ElevationValueType>
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
    -> VecMap<ElevationValueType>
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
      elevations_minimap(
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
