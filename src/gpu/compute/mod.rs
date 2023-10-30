
mod elevations;
mod init_animals;

pub(crate) use self::{
  elevations::{
    InitializeElevationsParams,
    initialize_elevations,

    mini_elevations,
  },
  init_animals::{
    InitializeAnimalsParams,
    initialize_animals,
  },
};