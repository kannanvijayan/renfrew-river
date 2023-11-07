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
    CellInfo,
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
      world_dims,
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
  }

  pub(crate) fn move_animals(&self) {
    futures::executor::block_on(async {
      let target_positions_buffer = compute_downhill_movement(
        &self.device,
        &self.elevation_map,
        &self.animals_list,
      ).await;

      let conflicts_map_buffer = resolve_animal_move_conflicts(
        &self.device,
        &self.animals_list,
        &self.animals_map,
        &target_positions_buffer,
      ).await;

      apply_animal_moves(
        &self.device,
        &target_positions_buffer,
        &conflicts_map_buffer,
        &self.animals_list,
        &self.animals_map,
      ).await;
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

  pub(crate) fn read_cell_info(&self, coord: CellCoord)
    -> CellInfo
  {
    let elevation = self.read_cell_elevation(coord);
    let animal_id = self.read_cell_animal_id(coord);
    CellInfo { elevation, animal_id }
  }

  fn read_cell_elevation(&self, coord: CellCoord) -> Elevation {
    // We can easily generate unaligned reads here, so we adjust the
    // read index to be aligned, and the size up as necessary.
    
    // We align the colum and row down to a multiple of 4, and make
    // the size 4.
    const ALIGN: u16 = 4;
    let aligned_col = coord.col & !(ALIGN - 1);
    let aligned_row = coord.row & !(ALIGN - 1);
    let aligned_coord = CellCoord::new(aligned_col, aligned_row);
    let offset_coord = CellCoord::new(
      coord.col - aligned_col,
      coord.row - aligned_row,
    );

    let elev_vec_map = futures::executor::block_on(async {
      debug_assert!(self.world_dims.contains_coord(coord));
      self.elevation_map
        .read_mappable_area_copy(
          &self.device,
          aligned_coord,
          WorldDims::new(ALIGN, ALIGN)).await
        .to_vec_map().await
    });
    elev_vec_map.get_copy(offset_coord)
  }

  fn read_cell_animal_id(&self, coord: CellCoord) -> Option<AnimalId> {
    // We align the colum and row down to a multiple of 4, and make
    // the size 4.
    const ALIGN: u16 = 4;
    let aligned_col = coord.col & !(ALIGN - 1);
    let aligned_row = coord.row & !(ALIGN - 1);
    let aligned_coord = CellCoord::new(aligned_col, aligned_row);
    let offset_coord = CellCoord::new(
      coord.col - aligned_col,
      coord.row - aligned_row,
    );

    let animals_vec_map = futures::executor::block_on(async {
      debug_assert!(self.world_dims.contains_coord(coord));
      self.animals_map
        .read_mappable_area_copy(
          &self.device,
          aligned_coord,
          WorldDims::new(ALIGN, ALIGN)).await
        .to_vec_map().await
    });
    let animal_id = animals_vec_map.get_copy(offset_coord);
    if animal_id == AnimalId::INVALID {
      None
    } else {
      Some(animal_id)
    }
  }

  pub(crate) fn read_animal_data(&self, animal_id: AnimalId)
    -> AnimalData
  {
    const ALIGN: u32 = 4;
    let animal_id = animal_id.to_u32();
    let aligned_id = animal_id & !(ALIGN - 1);
    let offset_id = animal_id - aligned_id;

    futures::executor::block_on(async {
      let animal_data_vec = self.animals_list.read_mappable_subseq_copy(
        &self.device,
        aligned_id as usize,
        ALIGN as usize,
      ).await;
      animal_data_vec.to_vec().await[offset_id as usize]
    })
  }
}
