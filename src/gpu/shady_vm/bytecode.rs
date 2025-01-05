use crate::gpu::shady_vm::{ bitcode, register_file };

const SHADY_JUMP_OFFSET_MAX: i32 = 0x7FF;
const SHADY_JUMP_OFFSET_MIN: i32 = -0x800;

#[derive(Clone, Copy, Debug)]
pub(crate) struct Ins {
  cond: Cond,
  set_flags: bool,
  ind_src1: bool,
  ind_src2: bool,
  ind_dst: bool,
  variant: Variant,
}
impl Ins {
  pub(crate) fn new(
    cond: Cond,
    set_flags: bool,
    ind_src1: bool,
    ind_src2: bool,
    ind_dst: bool,
    variant: Variant,
  ) -> Self {
    Self { cond, set_flags, ind_src1, ind_src2, ind_dst, variant }
  }
  pub(crate) fn new_standard(variant: Variant) -> Self {
    Self::new(Cond::Always, true, false, false, false, variant)
  }
  pub(crate) fn to_bitcode<F>(&self,
    offset: u32,
    label_map: F
  ) -> bitcode::Instruction
    where F: Fn(&str) -> u32
  {
    let cond = self.cond.to_bitcode();
    let set_flags = self.set_flags;

    let mut imm_src1 = false;
    let mut imm_src2 = false;
    let mut shift16_src2 = false;
    let mut ind_src1 = false;
    let mut ind_src2 = false;
    let mut ind_dst = false;
    let mut cflow = bitcode::ControlFlow::None;

    let mut negate_dst = false;
    let mut bump_dst: i8 = 0;
    let mut reg_dst: u8 = 0;

    let mut negate_src1 = false;
    let mut shift_src1: i8 = 0;
    let mut reg_src1: u8 = 0;
    let mut immval_src1: i16 = 0;

    let mut negate_src2 = false;
    let mut shift_src2: i8 = 0;
    let mut reg_src2: u8 = 0;
    let mut immval_src2: i16 = 0;

    let mut op_kind = bitcode::OperationKind::Add;

    match self.variant {
      Variant::Compute { dst, op, src1, src2 } => {
        reg_dst = dst.reg.0;
        bump_dst = dst.bump.0;
        ind_src1 = self.ind_src1;
        ind_src2 = self.ind_src2;
        ind_dst = self.ind_dst;

        match src1 {
          Src::Imm(ival) => {
            imm_src1 = true;
            immval_src1 = ival;
          },
          Src::Reg(reg, shift) => {
            shift_src1 = shift.0;
            reg_src1 = reg.0;
          }
        }
        match src2 {
          Src::Imm(ival) => {
            imm_src2 = true;
            immval_src2 = ival;
          },
          Src::Reg(reg, shift) => {
            shift_src2 = shift.0;
            reg_src2 = reg.0;
          }
        }

        match op {
          Op::Add => {
            op_kind = bitcode::OperationKind::Add;
          },
          Op::Sub => {
            op_kind = bitcode::OperationKind::Add;
            negate_src2 = true;
          },
          Op::Mul => {
            op_kind = bitcode::OperationKind::Mul;
          },
          Op::Div => {
            op_kind = bitcode::OperationKind::Div;
          },
          Op::Mod => {
            op_kind = bitcode::OperationKind::Mod;
          },
          Op::BitAnd => {
            op_kind = bitcode::OperationKind::BitAnd;
          },
          Op::BitOr => {
            op_kind = bitcode::OperationKind::BitOr;
          },
          Op::BitXor => {
            op_kind = bitcode::OperationKind::BitXor;
          },
          Op::Max => {
            op_kind = bitcode::OperationKind::Max;
          },
          Op::Min => {
            op_kind = bitcode::OperationKind::Max;
            negate_src1 = true;
            negate_src2 = true;
            negate_dst = true;
          },
        }
      },
      Variant::Cflow { cf } => {
        match cf {
          Cflow::None => {
          },
          Cflow::Jump(label) => {
            let target_offset = label_map(label);
            let offset_diff = target_offset as i32 - offset as i32;
            if offset_diff > SHADY_JUMP_OFFSET_MAX || offset_diff < SHADY_JUMP_OFFSET_MIN {
              panic!("Jump offset too large: {}", offset_diff);
            }

            // generate a relative jump.
            op_kind = bitcode::OperationKind::Add;
            reg_src1 = register_file::SHADY_REG_PC;

            imm_src2 = true;
            immval_src2 = offset_diff as i16;

            reg_dst = register_file::SHADY_REG_PC;
            cflow = bitcode::ControlFlow::Write;
          },
          Cflow::Call(label) => {
            let target_offset = label_map(label);
            let offset_diff = target_offset as i32 - offset as i32;
            if offset_diff > SHADY_JUMP_OFFSET_MAX || offset_diff < SHADY_JUMP_OFFSET_MIN {
              panic!("Call offset too large: {}", offset_diff);
            }

            // generate a relative call.
            op_kind = bitcode::OperationKind::Add;
            reg_src1 = register_file::SHADY_REG_PC;

            imm_src2 = true;
            immval_src2 = offset_diff as i16;

            reg_dst = register_file::SHADY_REG_PC;
            cflow = bitcode::ControlFlow::Call;
          },
          Cflow::Return => {
            cflow = bitcode::ControlFlow::Ret;

            op_kind = bitcode::OperationKind::Max;

            reg_dst = register_file::SHADY_REG_PC;

            reg_src1 = register_file::SHADY_REG_PC;

            imm_src2 = true;
            immval_src2 = 0;
          },
        }
      },
      Variant::Imm32 { dst, value } => {
        op_kind = bitcode::OperationKind::BitOr;

        reg_dst = dst.reg.0;

        imm_src1 = true;
        immval_src1 = (value & 0xFFFF) as i16;

        imm_src2 = true;
        immval_src2 = (value >> 16) as i16;

        shift16_src2 = true;
      },
      Variant::Terminate => {
        // Generate a jump-to-self.
        op_kind = bitcode::OperationKind::Max;

        reg_dst = register_file::SHADY_REG_PC;

        reg_src1 = register_file::SHADY_REG_PC;

        imm_src2 = true;
        immval_src2 = 0;

        cflow = bitcode::ControlFlow::Write;
      }
    };

    let op_word = bitcode::OpWord {
      cond,
      set_flags,
      imm_src1,
      imm_src2,
      shift16_src2,
      ind_src1,
      ind_src2,
      ind_dst,
      kind: op_kind,
      cflow,
    };
    let dst_word = bitcode::DstWord {
      reg: reg_dst,
      negate: negate_dst,
      bump: bump_dst,
    };
    let src1_word = if imm_src1 {
      bitcode::SrcWord::Immediate { value: immval_src1 }
    } else {
      bitcode::SrcWord::Register {
        reg: reg_src1,
        negate: negate_src1,
        shift: shift_src1,
      }
    };
    let src2_word = if imm_src2 {
      bitcode::SrcWord::Immediate { value: immval_src2 }
    } else {
      bitcode::SrcWord::Register {
        reg: reg_src2,
        negate: negate_src2,
        shift: shift_src2,
      }
    };
    bitcode::Instruction::new(op_word, dst_word, src1_word, src2_word)
  }
}

#[derive(Clone, Copy, Debug)]
pub(crate) enum Variant {
  Compute { dst: Dst, op: Op, src1: Src, src2: Src },
  Cflow { cf: Cflow },
  Imm32 { dst: Dst, value: i32 },
  Terminate,
}
impl Variant {
  pub(crate) fn new_compute(dst: Dst, op: Op, src1: Src, src2: Src) -> Self {
    Self::Compute { dst, op, src1, src2 }
  }

  pub(crate) fn new_cflow(cf: Cflow) -> Self {
    Self::Cflow { cf }
  }

  pub(crate) fn new_imm32(dst: Dst, value: i32) -> Self {
    Self::Imm32 { dst, value }
  }

  pub(crate) fn new_terminate() -> Self {
    Self::Terminate
  }

  pub(crate) fn is_compute(&self) -> bool {
    matches!(self, Self::Compute { .. })
  }
}

#[derive(Clone, Copy, Debug)]
pub(crate) struct Dst {
  reg: Reg,
  bump: Bump,
}
impl Dst {
  pub(crate) fn new(reg: Reg, bump: Bump) -> Self {
    let reg = Reg::from(reg);
    Self { reg, bump }
  }
}

#[derive(Clone, Copy, Debug)]
pub(crate) enum Src {
  Imm(i16),
  Reg(Reg, Shift),
}
impl Src {
  pub(crate) fn new_reg(reg: Reg, shift: Shift) -> Self {
    let reg = Reg::from(reg);
    Self::Reg(reg, shift)
  }
  pub(crate) fn new_imm(imm: i16) -> Self {
    Self::Imm(imm)
  }
}

#[derive(Clone, Copy, Debug)]
pub(crate) struct Reg(u8);
impl Reg {
  pub(crate) fn new(reg: u8) -> Self {
    assert!(reg <= register_file::SHADY_REG_LAST_GP);
    Self(reg)
  }

  pub(crate) fn new_special(reg: u8) -> Self {
    assert!(reg >= register_file::SHADY_REG_LAST_GP);
    Self(reg)
  }
}

#[derive(Clone, Copy, Debug)]
#[repr(u8)]
pub(crate) enum Cond {
  Never,
  Equal,
  Less,
  LessEqual,
  Greater,
  GreaterEqual,
  NotEqual,
  Always,
}
impl Cond {
  fn to_bitcode(self) -> bitcode::Condition {
    match self {
      Self::Never => bitcode::Condition::Never,
      Self::Equal => bitcode::Condition::Equal,
      Self::Less => bitcode::Condition::Less,
      Self::LessEqual => bitcode::Condition::LessEqual,
      Self::Greater => bitcode::Condition::Greater,
      Self::GreaterEqual => bitcode::Condition::GreaterEqual,
      Self::NotEqual => bitcode::Condition::NotEqual,
      Self::Always => bitcode::Condition::Always,
    }
  }
}

#[derive(Clone, Copy, Debug)]
#[repr(u8)]
pub(crate) enum Op {
  Add,
  Sub,
  Mul,
  Div,
  Mod,
  BitAnd,
  BitOr,
  BitXor,
  Max,
  Min,
}

#[derive(Clone, Copy, Debug)]
#[repr(u8)]
pub(crate) enum Cflow {
  None,
  Jump(&'static str),
  Call(&'static str),
  Return,
}

#[derive(Clone, Copy, Debug)]
pub(crate) struct Shift(i8);
impl Shift {
  pub(crate) fn new(shift: i8) -> Self {
    assert!(
      shift >= bitcode::SHADY_INS_SRC_SHIFT_MIN &&
      shift <= bitcode::SHADY_INS_SRC_SHIFT_MAX
    );
    Self(shift)
  }
}

#[derive(Clone, Copy, Debug)]
pub(crate) struct Bump(i8);
impl Bump {
  pub(crate) fn new(bump: i8) -> Self {
    assert!(
      bump >= bitcode::SHADY_INS_DST_BUMP_MIN &&
      bump <= bitcode::SHADY_INS_DST_BUMP_MAX
    );
    Self(bump)
  }
}
