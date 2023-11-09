use log;
use crate::{
  world::{
    CellCoord,
    WorldDims,
    InitParams,
    VecMap,
    Elevation,
    ElevationValueType,
    AnimalId,
    AnimalData,
    TurnNo,
    CellInfo,
  },
  gpu::{ GpuWorld, GpuWorldParams },
};

pub(crate) struct World {
  // Dimensions of the world.
  world_dims: WorldDims,

  // The world state inside the GPU.
  gpu_world: GpuWorld,

  // The current turn number.
  turn_no: TurnNo,
}
impl World {
  pub(crate) fn new(init_params: InitParams) -> World {
    let InitParams { world_dims, rand_seed, extra_flags } = init_params;
    let gpu_world = GpuWorld::new(GpuWorldParams {
      world_dims,
      rand_seed,
      extra_flags,
    });
    let turn_no = TurnNo(0);
    World {
      world_dims,
      gpu_world,
      turn_no,
    }
  }

  pub(crate) fn initialize(&mut self) {
    log::debug!("World::initialize");
    self.gpu_world.init_elevations();
    self.gpu_world.init_animals();
  }

  pub(crate) fn world_dims(&self) -> WorldDims {
    self.world_dims
  }

  pub(crate) fn read_elevation_values(&self, top_left: CellCoord, area: WorldDims)
    -> VecMap<ElevationValueType>
  {
    self.gpu_world.read_elevation_values(top_left, area)
  }
  pub(crate) fn read_animal_ids(&self, top_left: CellCoord, area: WorldDims)
    -> VecMap<AnimalId>
  {
    self.gpu_world.read_animal_ids(top_left, area)
  }

  pub(crate) fn mini_elevation_values(&self, mini_dims: WorldDims)
    -> VecMap<ElevationValueType>
  {
    self.gpu_world.mini_elevation_values(mini_dims)
  }

  pub(crate) fn read_animals_entity_data(&self) -> Vec<AnimalData> {
    self.gpu_world.read_animals_entity_data()
  }

  pub(crate) fn take_turn_step(&mut self) -> TakeTurnStepResult {
    let prior_time = std::time::Instant::now();
    self.gpu_world.move_animals();
    let elapsed_ms =
      prior_time.elapsed().as_millis()
        .clamp(0 as u128, u32::MAX as u128) as u32;
    let turn_no_after = self.turn_no.next();
    self.turn_no = turn_no_after;
    TakeTurnStepResult { turn_no_after, elapsed_ms }
  }

  pub(crate) fn read_cell_info(&self, coord: CellCoord)
    -> CellInfo
  {
    self.gpu_world.read_cell_info(coord)
  }

  pub(crate) fn read_animal_data(&self, animal_id: AnimalId)
    -> AnimalData
  {
    self.gpu_world.read_animal_data(animal_id)
  }
}

pub(crate) struct TakeTurnStepResult {
  pub(crate) turn_no_after: TurnNo,
  pub(crate) elapsed_ms: u32,
}
