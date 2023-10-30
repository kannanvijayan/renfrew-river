use log;
use crate::{
  world::{
    CellCoord,
    WorldDims,
    InitParams,
    VecMap,
    TerrainElevationValueType,
    AnimalData,
  },
  gpu::{ GpuWorld, GpuWorldParams },
};

pub(crate) struct World {
  // Dimensions of the world.
  world_dims: WorldDims,

  gpu_world: GpuWorld,
}
impl World {
  pub(crate) fn new(init_params: InitParams) -> World {
    let world_dims = init_params.world_dims();
    let rand_seed = init_params.rand_seed();
    let gpu_world = GpuWorld::new(GpuWorldParams {
      world_dims,
      rand_seed,
    });
    World {
      world_dims,
      gpu_world,
    }
  }

  pub(crate) fn initialize(&mut self) {
    log::debug!("World::initialize");
    self.gpu_world.init_elevations();
    self.gpu_world.init_animals();
  }

  pub(crate) fn read_elevation_values(&self, top_left: CellCoord, area: WorldDims)
    -> VecMap<TerrainElevationValueType>
  {
    self.gpu_world.read_elevation_values(top_left, area)
  }

  pub(crate) fn mini_elevation_values(&self, mini_dims: WorldDims)
    -> VecMap<TerrainElevationValueType>
  {
    self.gpu_world.mini_elevation_values(mini_dims)
  }

  pub(crate) fn read_animals_entity_data(&self) -> Vec<AnimalData> {
    self.gpu_world.read_animals_entity_data()
  }
}