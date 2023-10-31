
mod fill_map_u32;
mod init_elevations;
mod minify_elevations;
mod init_animals;

mod initialize_elevations;
mod initialize_animals;
mod elevations_minimap;

pub(crate) use self::{
  initialize_elevations::initialize_elevations,
  initialize_animals::initialize_animals,
  elevations_minimap::elevations_minimap,
};