
mod fill_map_u32;
mod init_elevations;
mod minify_elevations;
mod init_animals;
mod look_and_move;

mod initialize_elevations;
mod initialize_animals;
mod elevations_minimap;
mod compute_animal_moves;

pub(crate) use self::{
  initialize_elevations::initialize_elevations,
  initialize_animals::initialize_animals,
  elevations_minimap::elevations_minimap,
  compute_animal_moves::compute_animal_moves,
};