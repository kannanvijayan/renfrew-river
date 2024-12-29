use crate::gpu::GpuBufferDataType;

#[derive(Clone, Copy, Debug)]
pub(crate) struct ShadyRegisterFile {
  regs: [u32; SHADY_REG_COUNT]
}
impl ShadyRegisterFile {
  pub(crate) fn read_reg(&self, reg: u8) -> u32 {
    self.regs[reg as usize]
  }
}
impl GpuBufferDataType for ShadyRegisterFile {
  type NativeType = [u32; SHADY_REG_COUNT];
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

pub(crate) const SHADY_REG_CALLSTACK_0: u8 = 252;
pub(crate) const SHADY_REG_CALLSTACK_1: u8 = 251;
pub(crate) const SHADY_REG_CALLSTACK_2: u8 = 250;
pub(crate) const SHADY_REG_CALLSTACK_3: u8 = 249;
