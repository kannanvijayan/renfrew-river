use crate::cog::CogBufferType;

#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct ShadyRegister(u8);
impl ShadyRegister {
  pub(crate) const fn new(val: u8) -> Self {
    ShadyRegister(val)
  }

  pub(crate) const fn to_u8(&self) -> u8 {
    self.0
  }
}
impl From<u8> for ShadyRegister {
  fn from(reg: u8) -> Self { Self(reg) }
}

#[derive(Clone, Copy, Debug)]
pub(crate) struct ShadyRegisterFile {
  regs: [i32; SHADY_REG_COUNT]
}
impl ShadyRegisterFile {
  pub(crate) fn read_reg(&self, reg: u8) -> i32 {
    self.regs[reg as usize]
  }
}
impl CogBufferType for ShadyRegisterFile {
  type GpuType = [i32; SHADY_REG_COUNT];
}
impl From<[i32; SHADY_REG_COUNT]> for ShadyRegisterFile {
  fn from(regs: <Self as CogBufferType>::GpuType) -> Self { Self { regs } }
}
impl Into<[i32; SHADY_REG_COUNT]> for ShadyRegisterFile {
  fn into(self) -> <Self as CogBufferType>::GpuType { self.regs }
}

/*
 * The following is copy-pasted from `shady_vm.wgsl`.
 */

pub(crate) const SHADY_REG_COUNT: usize = 256;

pub(crate) const SHADY_REG_LAST_GP: u8 = 239;
pub(crate) const SHADY_REG_VMID: u8 = 240;
pub(crate) const SHADY_REG_PC: u8 = 241;
