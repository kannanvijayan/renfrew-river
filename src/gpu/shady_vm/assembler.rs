use crate::gpu::shady_vm::{
  ShadyInsOp,
  ShadyRegister,
  ShadyDestRegister,
  ShadyImmediate,
  ShadyOperand,
  ShadyInstructionCompute,
  ShadyInstruction,
  ShadyInstructionDataFlow,
  ShadyImmediateX2,
};

use super::ShadyInsCond;

pub(crate) struct ShadyAssembler {
  // Keeps a list of instructions to assemble.
  instruction: Vec<ShadyInstruction>,
}
impl ShadyAssembler {
  pub(crate) fn new() -> ShadyAssembler {
    ShadyAssembler {
      instruction: Vec::new(),
    }
  }

  pub(crate) fn add_instruction(&mut self, instruction: ShadyInstruction) {
    self.instruction.push(instruction);
  }
}

pub(crate) struct ShadyAssemblyBuilder<'a> {
  assembler: &'a mut ShadyAssembler,
}
impl<'a> ShadyAssemblyBuilder<'a> {

  pub(crate) fn reg(&mut self, value: u8) -> ShadyRegister {
    ShadyRegister::from_u8(value)
  }
  pub(crate) fn dest(&mut self, value: u8) -> ShadyDestRegister {
    ShadyDestRegister::from_u8(value)
  }
  pub(crate) fn imm(&mut self, value: u8) -> ShadyImmediate {
    ShadyImmediate::from_u8(value)
  }

  pub(crate) fn op_immed<X0, X1>(&mut self, x0: X0, x1: X1)
    -> ShadyInstructionCompute
    where
      X0: Into<ShadyOperand>,
      X1: Into<ShadyOperand>,
  {
    ShadyInstructionCompute::new(x0.into(), x1.into(), ShadyInsOp::Immed)
  }
  pub(crate) fn op_add<X0, X1>(&mut self, x0: X0, x1: X1)
    -> ShadyInstructionCompute
    where
      X0: Into<ShadyOperand>,
      X1: Into<ShadyOperand>,
  {
    ShadyInstructionCompute::new(x0.into(), x1.into(), ShadyInsOp::Add)
  }
  pub(crate) fn op_sub<X0, X1>(&mut self, x0: X0, x1: X1)
    -> ShadyInstructionCompute
    where
      X0: Into<ShadyOperand>,
      X1: Into<ShadyOperand>,
  {
    ShadyInstructionCompute::new(x0.into(), x1.into(), ShadyInsOp::Sub)
  }
  pub(crate) fn op_mul<X0, X1>(&mut self, x0: X0, x1: X1)
    -> ShadyInstructionCompute
    where
      X0: Into<ShadyOperand>,
      X1: Into<ShadyOperand>,
  {
    ShadyInstructionCompute::new(x0.into(), x1.into(), ShadyInsOp::Mul)
  }
  pub(crate) fn op_div<X0, X1>(&mut self, x0: X0, x1: X1)
    -> ShadyInstructionCompute
    where
      X0: Into<ShadyOperand>,
      X1: Into<ShadyOperand>,
  {
    ShadyInstructionCompute::new(x0.into(), x1.into(), ShadyInsOp::Div)
  }
  pub(crate) fn op_mod<X0, X1>(&mut self, x0: X0, x1: X1)
    -> ShadyInstructionCompute
    where
      X0: Into<ShadyOperand>,
      X1: Into<ShadyOperand>,
  {
    ShadyInstructionCompute::new(x0.into(), x1.into(), ShadyInsOp::Mod)
  }
  pub(crate) fn op_lsh<X0, X1>(&mut self, x0: X0, x1: X1)
    -> ShadyInstructionCompute
    where
      X0: Into<ShadyOperand>,
      X1: Into<ShadyOperand>,
  {
    ShadyInstructionCompute::new(x0.into(), x1.into(), ShadyInsOp::Lsh)
  }
  pub(crate) fn op_rsh<X0, X1>(&mut self, x0: X0, x1: X1)
    -> ShadyInstructionCompute
    where
      X0: Into<ShadyOperand>,
      X1: Into<ShadyOperand>,
  {
    ShadyInstructionCompute::new(x0.into(), x1.into(), ShadyInsOp::Rsh)
  }
  pub(crate) fn op_and<X0, X1>(&mut self, x0: X0, x1: X1)
    -> ShadyInstructionCompute
    where
      X0: Into<ShadyOperand>,
      X1: Into<ShadyOperand>,
  {
    ShadyInstructionCompute::new(x0.into(), x1.into(), ShadyInsOp::And)
  }
  pub(crate) fn op_or<X0, X1>(&mut self, x0: X0, x1: X1)
    -> ShadyInstructionCompute
    where
      X0: Into<ShadyOperand>,
      X1: Into<ShadyOperand>,
  {
    ShadyInstructionCompute::new(x0.into(), x1.into(), ShadyInsOp::Or)
  }
  pub(crate) fn op_xor<X0, X1>(&mut self, x0: X0, x1: X1)
    -> ShadyInstructionCompute
    where
      X0: Into<ShadyOperand>,
      X1: Into<ShadyOperand>,
  {
    ShadyInstructionCompute::new(x0.into(), x1.into(), ShadyInsOp::Xor)
  }

  pub(crate) fn df_mov(&mut self, x2: ShadyDestRegister)
    -> ShadyInstructionDataFlow
  {
    ShadyInstructionDataFlow::mov(x2)
  }
  pub(crate) fn df_read(&mut self, x2: ShadyDestRegister)
    -> ShadyInstructionDataFlow
  {
    ShadyInstructionDataFlow::read(x2)
  }
  pub(crate) fn df_write(&mut self, x2: ShadyDestRegister)
    -> ShadyInstructionDataFlow
  {
    ShadyInstructionDataFlow::write(x2)
  }
  pub(crate) fn df_write_imm(&mut self, x2: ShadyImmediateX2)
    -> ShadyInstructionDataFlow
  {
    ShadyInstructionDataFlow::write_imm(x2)
  }

  pub(crate) fn df_jump(&mut self) -> ShadyInstructionDataFlow {
    ShadyInstructionDataFlow::jump()
  }
  pub(crate) fn df_call(&mut self) -> ShadyInstructionDataFlow {
    ShadyInstructionDataFlow::call()
  }
  pub(crate) fn df_ret(&mut self) -> ShadyInstructionDataFlow {
    ShadyInstructionDataFlow::ret()
  }
  pub(crate) fn df_end(&mut self) -> ShadyInstructionDataFlow {
    ShadyInstructionDataFlow::end()
  }

  pub(crate) fn ins_if_never(&mut self,
    compute: ShadyInstructionCompute,
    data_flow: ShadyInstructionDataFlow,
    set_flags: bool,
  ) {
    let cond = ShadyInsCond::Never;
    self.assembler.add_instruction(
      ShadyInstruction { cond, compute, data_flow, set_flags }
    );
  }

  pub(crate) fn ins_if_lt(&mut self,
    compute: ShadyInstructionCompute,
    data_flow: ShadyInstructionDataFlow,
    set_flags: bool,
  ) {
    let cond = ShadyInsCond::LessThan;
    self.assembler.add_instruction(
      ShadyInstruction { cond, compute, data_flow, set_flags }
    );
  }

  pub(crate) fn ins_if_eq(&mut self,
    compute: ShadyInstructionCompute,
    data_flow: ShadyInstructionDataFlow,
    set_flags: bool,
  ) {
    let cond = ShadyInsCond::Equal;
    self.assembler.add_instruction(
      ShadyInstruction { cond, compute, data_flow, set_flags }
    );
  }

  pub(crate) fn ins_if_le(&mut self,
    compute: ShadyInstructionCompute,
    data_flow: ShadyInstructionDataFlow,
    set_flags: bool,
  ) {
    let cond = ShadyInsCond::LessThanOrEqual;
    self.assembler.add_instruction(
      ShadyInstruction { cond, compute, data_flow, set_flags }
    );
  }

  pub(crate) fn ins_if_gt(&mut self,
    compute: ShadyInstructionCompute,
    data_flow: ShadyInstructionDataFlow,
    set_flags: bool,
  ) {
    let cond = ShadyInsCond::GreaterThan;
    self.assembler.add_instruction(
      ShadyInstruction { cond, compute, data_flow, set_flags }
    );
  }

  pub(crate) fn ins_if_ne(&mut self,
    compute: ShadyInstructionCompute,
    data_flow: ShadyInstructionDataFlow,
    set_flags: bool,
  ) {
    let cond = ShadyInsCond::NotEqual;
    self.assembler.add_instruction(
      ShadyInstruction { cond, compute, data_flow, set_flags }
    );
  }

  pub(crate) fn ins_if_ge(&mut self,
    compute: ShadyInstructionCompute,
    data_flow: ShadyInstructionDataFlow,
    set_flags: bool,
  ) {
    let cond = ShadyInsCond::GreaterThanOrEqual;
    self.assembler.add_instruction(
      ShadyInstruction { cond, compute, data_flow, set_flags }
    );
  }

  pub(crate) fn ins(&mut self,
    compute: ShadyInstructionCompute,
    data_flow: ShadyInstructionDataFlow,
    set_flags: bool,
  ) {
    let cond = ShadyInsCond::Always;
    self.assembler.add_instruction(
      ShadyInstruction { cond, compute, data_flow, set_flags }
    );
  }
}
