
mod cell_coord;
mod world_dims;
mod init_params;
mod world;
mod elevation;
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
  elevation::{ Elevation, ElevationValueType },
  terrain::TerrainKind,
  entity::{ EntityId, EntityData },
  animal::{ AnimalId, AnimalData },
};
