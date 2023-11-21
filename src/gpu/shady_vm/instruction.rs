
use super::bytecode_format as bf;

#[derive(Copy, Clone, Debug)]
pub(crate) struct ShadyRegister(u8);
impl ShadyRegister {
  pub(crate) const MAX_VALUE: u8 = bf::SHADY_MAX_REG;
  pub(crate) fn from_u8(value: u8) -> Self {
    assert!(value <= Self::MAX_VALUE);
    Self(value)
  }
  pub(crate) unsafe fn from_u8_unchecked(value: u8) -> Self {
    debug_assert!(value <= Self::MAX_VALUE);
    Self(value)
  }
  pub(crate) fn as_u32(&self) -> u32 { self.0 as u32 }
}

#[derive(Copy, Clone, Debug)]
pub(crate) struct ShadyDestRegister(u8);
impl ShadyDestRegister {
  pub(crate) const MAX_VALUE: u8 = 62;
  pub(crate) fn from_u8(value: u8) -> Self {
    assert!(value <= Self::MAX_VALUE);
    Self(value)
  }
  pub(crate) unsafe fn from_u8_unchecked(value: u8) -> Self {
    debug_assert!(value <= Self::MAX_VALUE);
    Self(value)
  }
  pub(crate) fn as_u8(&self) -> u8 { self.0 }
  pub(crate) fn as_u32(&self) -> u32 { self.0 as u32 }
}
impl Into<ShadyOperand> for ShadyDestRegister {
  fn into(self) -> ShadyOperand {
    ShadyOperand::Register(ShadyRegister::from_u8(self.0))
  }
}

#[derive(Copy, Clone, Debug)]
pub(crate) struct ShadyImmediate(u8);
impl ShadyImmediate {
  pub(crate) const MAX_VALUE: u8 = 63;
  pub(crate) fn from_u8(value: u8) -> Self {
    assert!(value <= Self::MAX_VALUE);
    Self(value)
  }
  pub(crate) unsafe fn from_u8_unchecked(value: u8) -> Self {
    debug_assert!(value <= Self::MAX_VALUE);
    Self(value)
  }
  pub(crate) fn as_u8(&self) -> u8 { self.0 }
  pub(crate) fn as_u32(&self) -> u32 { self.0 as u32 }
}
impl Into<ShadyOperand> for ShadyImmediate {
  fn into(self) -> ShadyOperand {
    ShadyOperand::Immediate(self)
  }
}

#[derive(Copy, Clone, Debug)]
pub(crate) struct ShadyImmediateX2(u8);
impl ShadyImmediateX2 {
  pub(crate) const MAX_VALUE: u8 = 62;
  pub(crate) fn from_u8(value: u8) -> Self {
    assert!(value <= Self::MAX_VALUE);
    Self(value)
  }
  pub(crate) unsafe fn from_u8_unchecked(value: u8) -> Self {
    debug_assert!(value <= Self::MAX_VALUE);
    Self(value)
  }
  pub(crate) fn as_u8(&self) -> u8 { self.0 }
  pub(crate) fn as_u32(&self) -> u32 { self.0 as u32 }
}

#[derive(Copy, Clone, Debug)]
pub(crate) enum ShadyOperand {
  Register(ShadyRegister),
  Immediate(ShadyImmediate),
}
impl ShadyOperand {
  pub(crate) fn as_u32(&self) -> u32 {
    match self {
      ShadyOperand::Register(r) => r.as_u32(),
      ShadyOperand::Immediate(i) => i.as_u32(),
    }
  }

  pub(crate) fn is_immediate(&self) -> bool {
    match self {
      ShadyOperand::Register(_) => false,
      ShadyOperand::Immediate(_) => true,
    }
  }
}

pub(crate) struct ShadyInstructionCompute {
  pub(crate) x0: ShadyOperand,
  pub(crate) x1: ShadyOperand,
  pub(crate) op: bf::ShadyInsOp,
}
impl ShadyInstructionCompute {
  pub(crate) fn encode(&self) -> u32 {
    let mut bcop: u32 = 0;
    bcop |= bf::SHADY_INS_FIELD_X0.encode(self.x0.as_u32());
    bcop |= bf::SHADY_INS_FIELD_X1.encode(self.x1.as_u32());
    bcop |= bf::SHADY_INS_FIELD_OP.encode(self.op as u32);
    bcop |= bf::SHADY_INS_FIELD_X0_IMM.encode(
      if self.x0.is_immediate() { 1 } else { 0 }
    );
    bcop |= bf::SHADY_INS_FIELD_X1_IMM.encode(
      if self.x1.is_immediate() { 1 } else { 0 }
    );
    bcop
  }

  pub(crate) fn new(x0: ShadyOperand, x1: ShadyOperand, op: bf::ShadyInsOp)
    -> Self
  {
    Self { x0, x1, op }
  }
}

pub(crate) struct ShadyInstructionDataFlow {
  pub(crate) x2: u8,
  pub(crate) df: bf::ShadyInsDf,
}
impl ShadyInstructionDataFlow {
  pub(crate) fn encode(&self) -> u32 {
    let mut bcop: u32 = 0;
    bcop |= bf::SHADY_INS_FIELD_X2.encode(self.x2 as u32);
    bcop |= bf::SHADY_INS_FIELD_DF.encode(self.df as u32);
    bcop
  }

  fn new(x2: u8, df: bf::ShadyInsDf) -> Self {
    Self { x2, df }
  }

  pub(crate) fn mov(x2: ShadyDestRegister) -> Self {
    Self::new(x2.as_u8(), bf::ShadyInsDf::MovOrJump)
  }
  pub(crate) fn read(x2: ShadyDestRegister) -> Self {
    Self::new(x2.as_u8(), bf::ShadyInsDf::ReadOrCall)
  }
  pub(crate) fn write(x2: ShadyDestRegister) -> Self {
    Self::new(x2.as_u8(), bf::ShadyInsDf::WriteOrRet)
  }
  pub(crate) fn write_imm(x2: ShadyImmediateX2) -> Self {
    Self::new(x2.as_u8(), bf::ShadyInsDf::WriteImmOrEnd)
  }

  pub(crate) fn jump() -> Self {
    Self::new(bf::SHADY_REG_CFLOW, bf::ShadyInsDf::MovOrJump)
  }
  pub(crate) fn call() -> Self {
    Self::new(bf::SHADY_REG_CFLOW, bf::ShadyInsDf::ReadOrCall)
  }
  pub(crate) fn ret() -> Self {
    Self::new(bf::SHADY_REG_CFLOW, bf::ShadyInsDf::WriteOrRet)
  }
  pub(crate) fn end() -> Self {
    Self::new(bf::SHADY_REG_CFLOW, bf::ShadyInsDf::WriteImmOrEnd)
  }

  /*
  MovOrJump = 0b00,
  ReadOrCall = 0b01,
  WriteOrRet = 0b10,
  WriteImmOrEnd = 0b11,
  */
}

pub(crate) struct ShadyInstruction {
  pub(crate) cond: bf::ShadyInsCond,
  pub(crate) compute: ShadyInstructionCompute,
  pub(crate) data_flow: ShadyInstructionDataFlow,
  pub(crate) set_flags: bool,
}
impl ShadyInstruction {
  pub(crate) fn encode(&self) -> u32 {
    let mut bcop: u32 = 0;
    bcop |= bf::SHADY_INS_FIELD_COND.encode(self.cond as u32);
    bcop |= self.compute.encode();
    bcop |= self.data_flow.encode();
    bcop |= bf::SHADY_INS_FIELD_SETFLAG.encode(
      if self.set_flags { 1 } else { 0 }
    );
    bcop
  }

  pub(crate) fn new(
    cond: bf::ShadyInsCond,
    compute: ShadyInstructionCompute,
    data_flow: ShadyInstructionDataFlow,
    set_flags: bool,
  ) -> Self {
    Self { cond, compute, data_flow, set_flags }
  }
}
