
mod cell_coord;
mod world_dims;
mod vec_map;
mod world_descriptor;

pub(crate) use self::{
  cell_coord::CellCoord,
  world_descriptor::{
    WorldDescriptor,
    WorldDescriptorInput,
    WorldDescriptorLimits,
    WorldDescriptorValidation,
  },
  world_dims::{ WorldDims, WorldDimsInput, WorldDimsValidation },
  vec_map::VecMap,
};
