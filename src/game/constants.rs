use crate::{
  world::WorldDims,
};

/** Maximum size of a game world. */
pub const MAX_WORLD_DIMS: WorldDims = WorldDims::new(1000, 1000);

/** Minimum size of a game world. */
pub const MIN_WORLD_DIMS: WorldDims = WorldDims::new(250, 250);

/** Constants related to shady vm */
mod shady_vm {
  use crate::shady_vm::{ ShadyRegister, SHADY_REG_COUNT };

  /** Number of reserved top-level registers in the VM. */
  pub const NUM_RESERVED_REGS: usize = 8;
  pub const FIRST_RESERVED_REG: ShadyRegister =
    ShadyRegister::new((SHADY_REG_COUNT - (1 + NUM_RESERVED_REGS)) as u8);
  
  /** Number of input registers. */
  pub const NUM_INPUT_REGS: usize = 128;
  pub const FIRST_INPUT_REG: ShadyRegister =
    ShadyRegister::new(FIRST_RESERVED_REG.to_u8() - NUM_INPUT_REGS as u8);

  /** Number of output registers. */
  pub const NUM_OUTPUT_REGS: usize = 64;
  pub const FIRST_OUTPUT_REG: ShadyRegister =
    ShadyRegister::new(FIRST_INPUT_REG.to_u8() - NUM_OUTPUT_REGS as u8);
}
