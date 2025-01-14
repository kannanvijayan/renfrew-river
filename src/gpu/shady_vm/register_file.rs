use crate::gpu::GpuBufferDataType;

#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct ShadyRegister(u8);
impl ShadyRegister {
  pub(crate) fn new(val: u8) -> Self {
    ShadyRegister(val)
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
impl GpuBufferDataType for ShadyRegisterFile {
  type NativeType = [i32; SHADY_REG_COUNT];
  fn to_native(&self) -> Self::NativeType { self.regs }
  fn from_native(regs: Self::NativeType) -> Self { Self { regs } }
}

/*
 * The following is copy-pasted from `shady_vm.wgsl`.
 */

pub(crate) const SHADY_REG_COUNT: usize = 256;

pub(crate) const SHADY_REG_LAST_GP: u8 = 239;
pub(crate) const SHADY_REG_VMID: u8 = 240;
pub(crate) const SHADY_REG_PC: u8 = 241;
