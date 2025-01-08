mod elevation_map;
mod animals_list;
mod animals_map;
mod species_list;
mod program_store;

use log;
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
      initialize_species,
      initialize_animals,
      compute_downhill_movement_with_shady_vm,
      resolve_animal_move_conflicts,
      apply_animal_moves,
      restore_animal_state,
    },
    shady_vm::{ ShadyProgram, ShadyProgramIndex },
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
  game::{
    constants,
    ExtraFlags
  },
  persist::{
    WorldPersist,
    AnimalsListPersist,
    ElevationMapPersist,
    SpeciesListPersist,
    ProgramStorePersist,
  },
};

pub(crate) use self::{
  elevation_map::GpuElevationMap,
  species_list::GpuSpeciesList,
  animals_list::GpuAnimalsList,
  animals_map::GpuAnimalsMap,
  program_store::GpuProgramStore,
};

/**
 * Parameters to initialize a GpuWorld.
 */
pub(crate) struct GpuWorldParams {
  pub(crate) world_dims: WorldDims,
  pub(crate) rand_seed: u64,
  pub(crate) extra_flags: ExtraFlags,
}

/**
 * The world state inside the GPU.
 */
pub(crate) struct GpuWorld {
  device: GpuDevice,

  world_dims: WorldDims,
  rand_seed: u64,
  extra_flags: ExtraFlags,

  // The terrain map.
  elevation_map: GpuElevationMap,

  // The list of animal entities.
  animals_list: GpuAnimalsList,

  // Map from tiles to animals.
  animals_map: GpuAnimalsMap,

  // The species list.
  species_list: GpuSpeciesList,

  // The program store.
  program_store: GpuProgramStore,
}
impl GpuWorld {
  pub(crate) fn new(init_params: GpuWorldParams) -> GpuWorld {
    let GpuWorldParams { world_dims, rand_seed, extra_flags } = init_params;
    let device = futures::executor::block_on(GpuDevice::new());

    let elevation_map = GpuElevationMap::new(&device, world_dims, "ElevationMap");
    let animals_list = GpuAnimalsList::new(&device, constants::MAX_ANIMALS, "AnimalsList");
    let animals_map = GpuAnimalsMap::new(&device, world_dims, "AnimalsMap");
    let species_list = GpuSpeciesList::new(&device, constants::MAX_SPECIES, "SpeciesData");

    let program_store = GpuProgramStore::new(&device);
    GpuWorld {
      device,
      world_dims,
      rand_seed,
      extra_flags,
      elevation_map,
      animals_list,
      animals_map,
      species_list,
      program_store,
    }
  }

  pub(crate) fn rand_seed(&self) -> u64 {
    self.rand_seed
  }

  pub(crate) fn extra_flags(&self) -> &ExtraFlags {
    &self.extra_flags
  }

  pub(crate) fn init_elevations(&self) {
    log::info!("INIT_ELEVATIONS EXTRA_FLAGS={:?}", self.extra_flags);
    let test_pattern =
      self.extra_flags.get_string("elevations.testPattern");
    log::info!("INIT_ELEVATIONS TEST_PATTERN={:?}", test_pattern);
    futures::executor::block_on(async {
      initialize_elevations(
        &self.device,
        self.rand_seed as u32,
        &self.elevation_map,
        test_pattern,
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

  pub(crate) fn init_species(&self) {
    futures::executor::block_on(async {
      initialize_species(&self.device, &self.species_list).await;
    });
  }

  pub(crate) fn add_program(&mut self, name: &str, program: ShadyProgram)
    -> ShadyProgramIndex
  {
    let index = self.program_store.add_program(name.to_string(), program);
    log::info!("Added program: name={} index={:?}", name, index);
    index
  }

  pub(crate) fn sync_programs(&mut self) {
    futures::executor::block_on(async {
      self.program_store.sync_gpu_buffer(&self.device).await;
    });
  }

  pub(crate) fn move_animals(&self) {
    let prior_time = std::time::Instant::now();
    futures::executor::block_on(async {
      let target_positions_buffer = compute_downhill_movement_with_shady_vm(
        &self.device,
        &self.program_store,
        &self.elevation_map,
        &self.animals_list,
      ).await;

      let conflicts = resolve_animal_move_conflicts(
        &self.device,
        &self.animals_list,
        &self.animals_map,
        &target_positions_buffer,
      ).await;

      apply_animal_moves(
        &self.device,
        &target_positions_buffer,
        &conflicts,
        &self.animals_list,
        &self.animals_map,
      ).await;
    });
    let elapsed = prior_time.elapsed();
    log::info!("move_animals(elapsed_ms={})", elapsed.as_millis());
  }

  pub(crate) fn read_elevation_values(&self, top_left: CellCoord, area: WorldDims)
    -> VecMap<ElevationValueType>
  {
    futures::executor::block_on(async {
      let out_buf = self.elevation_map.buffer().read_mappable_area_copy(
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
      let out_buf = self.animals_map.buffer().read_mappable_area_copy(
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
    let mini_buffer = GpuElevationMap::new(&self.device, mini_area, "MiniElevationsBuffer");
    futures::executor::block_on(async {
      elevations_minimap(
        &self.device,
        &self.elevation_map,
        &mini_buffer,
      ).await;
      mini_buffer
        .buffer()
        .read_mappable_full_copy(&self.device).await
        .cast_as_native_type().to_vec_map().await
    })
  }

  pub(crate) fn read_animals_entity_data(&self) -> Vec<AnimalData> {
    futures::executor::block_on(async {
      let out_buf = self.animals_list.buffer().read_mappable_subseq_copy(
        &self.device,
        0,
        self.animals_list.num_animals(),
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
        .buffer()
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
        .buffer()
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
      let animal_data_vec = self.animals_list.buffer().read_mappable_subseq_copy(
        &self.device,
        aligned_id as usize,
        ALIGN as usize,
      ).await;
      animal_data_vec.to_vec().await[offset_id as usize]
    })
  }

  pub(crate) fn animals_list_persist(&self) -> AnimalsListPersist {
    self.animals_list.to_persist(&self.device)
  }
  pub(crate) fn elevation_map_persist(&self) -> ElevationMapPersist {
    self.elevation_map.to_persist(&self.device)
  }
  pub(crate) fn species_list_persist(&self) -> SpeciesListPersist {
    self.species_list.to_persist()
  }
  pub(crate) fn program_store_persist(&self) -> ProgramStorePersist {
    self.program_store.to_persist()
  }

  pub(crate) fn from_persist(world_persist: &WorldPersist) -> Self {
    let device = futures::executor::block_on(GpuDevice::new());
    let world_dims = world_persist.world_dims();
    let rand_seed = world_persist.rand_seed();
    let extra_flags = world_persist.extra_flags().clone();
    let elevation_map = GpuElevationMap::from_persist(
      &device,
      world_dims,
      world_persist.elevation_map()
    );

    let (animals_list, animals_map) =
      futures::executor::block_on(restore_animal_state(
        &device,
        world_dims,
        world_persist.animals_list().as_slice().iter(),
      ));

    let species_list = GpuSpeciesList::from_persist(&device, world_persist.species_list());
    let program_store = GpuProgramStore::from_persist(&device, world_persist.program_store());
    GpuWorld {
      device,
      world_dims,
      rand_seed,
      extra_flags,
      elevation_map,
      animals_list,
      animals_map,
      species_list,
      program_store,
    }
  }
}
