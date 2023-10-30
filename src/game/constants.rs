
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

/**
 * The maximum number of animals in the game.
 */
pub(crate) const MAX_ANIMALS: usize = 1_000_000;