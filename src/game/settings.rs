use serde;
use crate::{
  world::InitParams,
  world::WorldDims,
};

pub(crate) const MIN_WORLD_DIMS: WorldDims = WorldDims::new(500, 500);
pub(crate) const MAX_WORLD_DIMS: WorldDims = WorldDims::new(8000, 8000);

#[derive(Clone, Debug)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct GameSettings {
  world_dims: WorldDims,
  rand_seed: u64,
}
impl GameSettings {
  pub(crate) fn new(world_dims: WorldDims, rand_seed: u64) -> GameSettings {
    assert!(world_dims.fits_within(MAX_WORLD_DIMS),
      "Site dimensions too large. Maximum is {:?}", MAX_WORLD_DIMS);
    assert!(MIN_WORLD_DIMS.fits_within(world_dims),
      "Site dimensions too small. Minimum is {:?}", MIN_WORLD_DIMS);
    GameSettings {
      world_dims,
      rand_seed,
    }
  }
  pub(crate) fn default() -> GameSettings {
    GameSettings::new(WorldDims::default(), 1)
  }

  pub(crate) fn world_dims(&self) -> &WorldDims {
    &self.world_dims
  }

  pub(crate) fn rand_seed(&self) -> u64 {
    self.rand_seed
  }

  // Convert into world init params.
  pub(crate) fn world_init_params(&self) -> InitParams {
    InitParams::new(self.world_dims, self.rand_seed)
  }
}

impl Default for GameSettings {
  fn default() -> Self {
    GameSettings::default()
  }
}