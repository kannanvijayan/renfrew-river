mod fill_map_u32;
mod init_elevations;
mod minify_elevations;
mod init_animals;
mod look_and_move;

pub(crate) use self::{
  fill_map_u32::fill_map_u32_command,
  init_elevations::init_elevations_command,
  minify_elevations::minify_elevations_command,
  init_animals::init_animals_command,
  look_and_move::look_and_move_command,
};
