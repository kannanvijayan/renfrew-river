use serde;
use crate::{
  game::{
    ExtraFlags,
    constants::{ MIN_WORLD_DIMS, MAX_WORLD_DIMS },
  },
  world::{ WorldDims, InitParams },
};

#[derive(Clone, Debug)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct GameSettings {
  #[serde(rename = "worldDims")]
  world_dims: WorldDims,

  #[serde(rename = "randSeed")]
  rand_seed: u64,

  #[serde(rename = "extraFlags")]
  #[serde(skip_serializing_if = "Option::is_none")]
  extra_flags: Option<String>,
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
      extra_flags: None,
    }
  }
  pub(crate) fn default() -> GameSettings {
    GameSettings::new(WorldDims::default(), 1)
  }

  pub(crate) fn world_dims(&self) -> &WorldDims {
    &self.world_dims
  }

  pub(crate) fn with_extra_flags(mut self, extra_flags: &str) -> Self {
    self.extra_flags = Some(extra_flags.to_string());
    self
  }

  // Convert into world init params.
  pub(crate) fn world_init_params(&self) -> InitParams {
    let extra_flags_str = self.extra_flags.as_ref().map(|s| s.as_str());
    let extra_flags = ExtraFlags::from_str(extra_flags_str);
    InitParams::new(self.world_dims, self.rand_seed, extra_flags)
  }
}

impl Default for GameSettings {
  fn default() -> Self {
    GameSettings::default()
  }
}
