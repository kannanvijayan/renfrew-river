use crate::world::{
  WorldDescriptor,
  WorldDescriptorInput,
  WorldDescriptorLimits,
  WorldDims,
};
use super::constants;

/** Default World Descriptor */
pub(crate) fn world_descriptor() -> WorldDescriptor {
  WorldDescriptor {
    name: String::new(),
    description: String::new(),
    seed: String::new(),
    dims: WorldDims::new(1000, 1000),
    ruleset_name: String::new(),
  }
}

/** Default World Descriptor Input */
pub(crate) fn world_descriptor_input() -> WorldDescriptorInput {
  world_descriptor().to_input()
}

/** Default world descriptor limits */
pub(crate) fn world_descriptor_limits() -> WorldDescriptorLimits {
  WorldDescriptorLimits {
    min_dims: constants::MIN_WORLD_DIMS,
    max_dims: constants::MAX_WORLD_DIMS,
    max_description_length: 1000,
  }
}
