use crate::world::WorldDims;

#[derive(Clone, Debug)]
pub(crate) struct InitParams {
  world_dims: WorldDims,
  rand_seed: u64,
}
impl InitParams {
  pub(crate) fn new(site_dims: WorldDims, rand_seed: u64) -> InitParams {
    InitParams {
      world_dims: site_dims,
      rand_seed,
    }
  }
  pub(crate) fn world_dims(&self) -> WorldDims {
    self.world_dims
  }

  pub(crate) fn rand_seed(&self) -> u64 {
    self.rand_seed
  }
}