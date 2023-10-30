
mod cell_coord;
mod world_dims;
mod init_params;
mod world;
mod terrain;
mod vec_map;
mod entity;
mod animal;

pub(crate) use self::{
  cell_coord::CellCoord,
  world_dims::WorldDims,
  init_params::InitParams,
  world::World,
  vec_map::VecMap,
  terrain::{
    TerrainKind,
    TerrainElevation,
    TerrainElevationValueType,

    TERRAIN_ELEVATION_BITS,
  },
  entity::{ EntityId, EntityData },
  animal::{ AnimalId, AnimalData },
};