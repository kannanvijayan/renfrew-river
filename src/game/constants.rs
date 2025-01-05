use crate::world::WorldDims;

/**
 * Limits for the game.
 */

/**
 * For pseudo-random number generation, the category value to use
 * to perturb the generation.
 */
#[repr(u32)]
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub(crate) enum RandGenCategory {
  InitAnimals = 1,
}
impl RandGenCategory {
  pub(crate) fn to_u32(&self) -> u32 {
    *self as u32
  }
}

/** The maximum number of animals in the game. */
pub(crate) const MAX_ANIMALS: usize = 10_000;

/** The maximum number of units in the game. */
pub(crate) const MAX_UNITS: usize = 50_000;

/** The number of bits used to represent terrain elevation. */
pub(crate) const ELEVATION_BITS: u32 = 12;

/** Minimum world dimensions. */
pub(crate) const MIN_WORLD_DIMS: WorldDims = WorldDims::new(500, 500);

/** Maximum world dimensions. */
pub(crate) const MAX_WORLD_DIMS: WorldDims = WorldDims::new(8000, 8000);
