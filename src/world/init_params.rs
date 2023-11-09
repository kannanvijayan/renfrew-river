use crate::{
  world::WorldDims,
  game::ExtraFlags,
};

#[derive(Clone, Debug)]
pub(crate) struct InitParams {
  pub(crate) world_dims: WorldDims,
  pub(crate) rand_seed: u64,
  pub(crate) extra_flags: ExtraFlags,
}
impl InitParams {
  pub(crate) fn new(
    site_dims: WorldDims,
    rand_seed: u64,
    extra_flags: ExtraFlags
  ) -> InitParams {
    InitParams {
      world_dims: site_dims,
      rand_seed,
      extra_flags,
    }
  }
}
