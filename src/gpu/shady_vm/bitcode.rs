use serde::{ Serialize, Deserialize };
use crate::gpu::GpuBufferDataType;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
#[derive(Serialize, Deserialize)]
pub(crate) struct Instruction {
  op_word: OpWord,
  dst_word: DstWord,
  src1_word: SrcWord,
  src2_word: SrcWord,
}
impl Instruction {
  pub(crate) fn new(
    op_word: OpWord,
    dst_word: DstWord,
    src1_word: SrcWord,
    src2_word: SrcWord
  ) -> Self {
    Self { op_word, dst_word, src1_word, src2_word }
  }
}
impl GpuBufferDataType for Instruction {
  type NativeType = [u32; 2];
  fn to_native(&self) -> Self::NativeType {
    let w0 = self.op_word.to_u32() | (self.dst_word.to_u32() << 16);
    let w1 = self.src1_word.to_u32() | (self.src2_word.to_u32() << 16);
    [w0, w1]
  }
  fn from_native(parts: Self::NativeType) -> Self {
    let op_word = OpWord::from_u32(parts[0] & 0xFFFF);
    let dst_word = DstWord::from_u32(parts[0] >> 16);
    let src1_word = op_word.parse_src1_word(parts[1] & 0xFFFF);
    let src2_word = op_word.parse_src2_word(parts[1] >> 16);
    Self::new(op_word, dst_word, src1_word, src2_word)
  }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
#[derive(Serialize, Deserialize)]
pub(crate) struct OpWord {
  pub(crate) cond: Condition,
  pub(crate) set_flags: bool,
  pub(crate) imm_src1: bool,
  pub(crate) imm_src2: bool,
  pub(crate) shift16_src2: bool,
  pub(crate) ind_src1: bool,
  pub(crate) ind_src2: bool,
  pub(crate) ind_dst: bool,
  pub(crate) kind: OperationKind,
  pub(crate) cflow: ControlFlow,
}
impl OpWord {
  pub(crate) fn to_u32(&self) -> u32 {
    let mut bits = 0;
    bits |= (self.cond as u32) << SHADY_INS_OP_COND_OFFSET;
    bits |= (self.set_flags as u32) << SHADY_INS_OP_SETFLAGS_OFFSET;
    bits |= (self.imm_src1 as u32) << SHADY_INS_OP_IMMSRC1_OFFSET;
    bits |= (self.imm_src2 as u32) << SHADY_INS_OP_IMMSRC2_OFFSET;
    bits |= (self.shift16_src2 as u32) << SHADY_INS_OP_SHIFT16_OFFSET;
    bits |= (self.ind_src1 as u32) << SHADY_INS_OP_INDSRC1_OFFSET;
    bits |= (self.ind_src2 as u32) << SHADY_INS_OP_INDSRC2_OFFSET;
    bits |= (self.ind_dst as u32) << SHADY_INS_OP_INDDST_OFFSET;
    bits |= (self.kind as u32) << SHADY_INS_OP_KIND_OFFSET;
    bits |= (self.cflow as u32) << SHADY_INS_OP_CFLOW_OFFSET;
    bits
  }

  fn from_u32(bits: u32) -> Self {
    let cond = Condition::from_u32(
      (bits >> SHADY_INS_OP_COND_OFFSET) & SHADY_INS_OP_COND_MASK
    );
    let set_flags = ((bits >> SHADY_INS_OP_SETFLAGS_OFFSET) & SHADY_INS_OP_SETFLAGS_MASK) != 0;
    let imm_src1 = ((bits >> SHADY_INS_OP_IMMSRC1_OFFSET) & SHADY_INS_OP_IMMSRC1_MASK) != 0;
    let imm_src2 = ((bits >> SHADY_INS_OP_IMMSRC2_OFFSET) & SHADY_INS_OP_IMMSRC2_MASK) != 0;
    let shift16_src2 = ((bits >> SHADY_INS_OP_SHIFT16_OFFSET) & SHADY_INS_OP_SHIFT16_MASK) != 0;
    let ind_src1 = ((bits >> SHADY_INS_OP_INDSRC1_OFFSET) & SHADY_INS_OP_INDSRC1_MASK) != 0;
    let ind_src2 = ((bits >> SHADY_INS_OP_INDSRC2_OFFSET) & SHADY_INS_OP_INDSRC2_MASK) != 0;
    let ind_dst = ((bits >> SHADY_INS_OP_INDDST_OFFSET) & SHADY_INS_OP_INDDST_MASK) != 0;
    let kind = OperationKind::from_u32(
      (bits >> SHADY_INS_OP_KIND_OFFSET) & SHADY_INS_OP_KIND_MASK
    );
    let cflow = ControlFlow::from_u32(
      (bits >> SHADY_INS_OP_CFLOW_OFFSET) & SHADY_INS_OP_CFLOW_MASK
    );
    Self {
      cond, set_flags,
      imm_src1, imm_src2, shift16_src2,
      ind_src1, ind_src2, ind_dst,
      kind, cflow
    }
  }

  fn parse_src1_word(&self, bits: u32) -> SrcWord {
    if self.imm_src1 {
      SrcWord::imm_from_u32(bits)
    } else {
      SrcWord::reg_from_u32(bits)
    }
  }
  fn parse_src2_word(&self, bits: u32) -> SrcWord {
    if self.imm_src2 {
      SrcWord::imm_from_u32(bits)
    } else {
      SrcWord::reg_from_u32(bits)
    }
  }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
#[derive(Serialize, Deserialize)]
pub(crate) struct DstWord {
  pub(crate) reg: u8,
  pub(crate) negate: bool,
  pub(crate) bump: i8,
}
impl DstWord {
  fn to_u32(&self) -> u32 {
    let mut bits = 0;
    bits |= ((self.reg as u32) & SHADY_INS_DST_REG_MASK) << SHADY_INS_DST_REG_OFFSET;
    bits |= (self.negate as u32) << SHADY_INS_DST_NEGATE_OFFSET;
    bits |= (((self.bump as i32) + SHADY_INS_DST_BUMP_BIAS) as u32) << SHADY_INS_DST_BUMP_OFFSET;
    bits
  }

  fn from_u32(bits: u32) -> Self {
    let reg = ((bits >> SHADY_INS_DST_REG_OFFSET) & SHADY_INS_DST_REG_MASK) as u8;
    let negate = ((bits >> SHADY_INS_DST_NEGATE_OFFSET) & SHADY_INS_DST_NEGATE_MASK) != 0;
    let bump = (
      ((bits >> SHADY_INS_DST_BUMP_OFFSET) & SHADY_INS_DST_BUMP_MASK) as i32
        - SHADY_INS_DST_BUMP_BIAS
    ) as i8;
    Self { reg, negate, bump }
  }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
#[derive(Serialize, Deserialize)]
pub(crate) enum SrcWord {
  Register { reg: u8, negate: bool, shift: i8 },
  Immediate { value: i16 },
}
impl SrcWord {
  fn to_u32(&self) -> u32 {
    match self {
      Self::Register { reg, negate, shift } => {
        let mut bits = 0;
        bits |= (*reg as u32 & SHADY_INS_SRC_REG_MASK) << SHADY_INS_SRC_REG_OFFSET;
        bits |= (*negate as u32) << SHADY_INS_SRC_NEGATE_OFFSET;
        bits |= ((*shift as i32 + SHADY_INS_SRC_SHIFT_BIAS) as u32) << SHADY_INS_SRC_SHIFT_OFFSET;
        bits
      },
      Self::Immediate { value } => *value as u16 as u32,
    }
  }

  fn reg_from_u32(bits: u32) -> Self {
    let reg = ((bits >> SHADY_INS_SRC_REG_OFFSET) & SHADY_INS_SRC_REG_MASK) as u8;
    let negate = ((bits >> SHADY_INS_SRC_NEGATE_OFFSET) & SHADY_INS_SRC_NEGATE_MASK) != 0;
    let shift = (
      ((bits >> SHADY_INS_SRC_SHIFT_OFFSET) & SHADY_INS_SRC_SHIFT_MASK) as i32
        - SHADY_INS_SRC_SHIFT_BIAS
    ) as i8;
    Self::Register { reg, negate, shift }
  }

  fn imm_from_u32(bits: u32) -> Self {
    Self::Immediate { value: bits as i32 as i16 }
  }
}

/*
 * The following is copy-pasted from `shady_vm.wgsl`.
 */

//// Operation: ?VVV-?PPP ?KJI-DCCC

/** Offset and mask to extract the condition flags. */
const SHADY_INS_OP_COND_OFFSET: u32 = 0;
const SHADY_INS_OP_COND_MASK: u32 = 0x7;

/** Offset and mask to extract the set flags bit. */
const SHADY_INS_OP_SETFLAGS_OFFSET: u32 = 3;
const SHADY_INS_OP_SETFLAGS_MASK: u32 = 0x1;

/** Offset and mask to extract the immediate source 1 bit. */
const SHADY_INS_OP_IMMSRC1_OFFSET: u32 = 4;
const SHADY_INS_OP_IMMSRC1_MASK: u32 = 0x1;

/** Offset and mask to extract the immediate source 2 bit. */
const SHADY_INS_OP_IMMSRC2_OFFSET: u32 = 5;
const SHADY_INS_OP_IMMSRC2_MASK: u32 = 0x1;

/** Offset and mask to extract the shift-16 source 2 bit. */
const SHADY_INS_OP_SHIFT16_OFFSET: u32 = 6;
const SHADY_INS_OP_SHIFT16_MASK: u32 = 0x1;

/** Offset and mask to extract the indirect source-1 bit. */
const SHADY_INS_OP_INDSRC1_OFFSET: u32 = 7;
const SHADY_INS_OP_INDSRC1_MASK: u32 = 0x1;

/** Offset and mask to extract the indirect source-2 bit. */
const SHADY_INS_OP_INDSRC2_OFFSET: u32 = 8;
const SHADY_INS_OP_INDSRC2_MASK: u32 = 0x1;

/** Offset and mask to extract the indirect destination bit. */
const SHADY_INS_OP_INDDST_OFFSET: u32 = 9;
const SHADY_INS_OP_INDDST_MASK: u32 = 0x1;

/** Offset and mask to extract the operation kind. */
const SHADY_INS_OP_KIND_OFFSET: u32 = 10;
const SHADY_INS_OP_KIND_MASK: u32 = 0x7;

/** Offset and mask to extract the control flow bits. */
const SHADY_INS_OP_CFLOW_OFFSET: u32 = 13;
const SHADY_INS_OP_CFLOW_MASK: u32 = 0x7;

//// Destination: BBBB-BBBN RRRR-RRRR

/** Offset and mask to extract the destination register. */
const SHADY_INS_DST_REG_OFFSET: u32 = 0;
const SHADY_INS_DST_REG_MASK: u32 = 0xFF;

/** Offset and mask to extract the negate result bit. */
const SHADY_INS_DST_NEGATE_OFFSET: u32 = 8;
const SHADY_INS_DST_NEGATE_MASK: u32 = 0x1;

/** Offset and mask to extract the bump value. */
const SHADY_INS_DST_BUMP_OFFSET: u32 = 9;
const SHADY_INS_DST_BUMP_MASK: u32 = 0x7F;

pub(crate) const SHADY_INS_DST_BUMP_MAX: i8 =
  (SHADY_INS_DST_BUMP_MASK >> 1) as i8;

pub(crate) const SHADY_INS_DST_BUMP_MIN: i8 =
  SHADY_INS_DST_BUMP_MAX - (SHADY_INS_DST_BUMP_MASK as i8);

pub(crate) const SHADY_INS_DST_BUMP_BIAS: i32 = 64;

//// Source: HHHH-HH?N RRRR-RRRR

/** Offset and mask to extract the source register. */
const SHADY_INS_SRC_REG_OFFSET: u32 = 0;
const SHADY_INS_SRC_REG_MASK: u32 = 0xFF;

/** Offset and mask to extract the negate source bit. */
const SHADY_INS_SRC_NEGATE_OFFSET: u32 = 8;
const SHADY_INS_SRC_NEGATE_MASK: u32 = 0x1;

/** Offset and mask to extract the shift amount. */
const SHADY_INS_SRC_SHIFT_OFFSET: u32 = 10;
const SHADY_INS_SRC_SHIFT_MASK: u32 = 0x3F;

pub(crate) const SHADY_INS_SRC_SHIFT_MAX: i8 =
  (SHADY_INS_SRC_SHIFT_MASK >> 1) as i8;

pub(crate) const SHADY_INS_SRC_SHIFT_MIN: i8 =
  SHADY_INS_SRC_SHIFT_MAX - (SHADY_INS_SRC_SHIFT_MASK as i8);

pub(crate) const SHADY_INS_SRC_SHIFT_BIAS: i32 = 32;

/** Opcode definitions. */
const SHADY_OPCODE_ADD: u32 = 0;
const SHADY_OPCODE_MUL: u32 = 1;
const SHADY_OPCODE_DIV: u32 = 2;
const SHADY_OPCODE_MOD: u32 = 3;
const SHADY_OPCODE_BITAND: u32 = 4;
const SHADY_OPCODE_BITOR: u32 = 5;
const SHADY_OPCODE_BITXOR: u32 = 6;
const SHADY_OPCODE_MAX: u32 = 7;

/** Condition flag definitions. */
const SHADY_COND_ZERO: u32 = 1;
const SHADY_COND_NEG: u32 = 2;
const SHADY_COND_POS: u32 = 4;

/** Control flow definitions. */
const SHADY_CFLOW_WRITE_BIT: u32 = 0;
const SHADY_CFLOW_CALL_BIT: u32 = 1;
const SHADY_CFLOW_RET_BIT: u32 = 2;


#[derive(Clone, Copy, Debug, PartialEq, Eq)]
#[derive(Serialize, Deserialize)]
#[repr(u8)]
pub(crate) enum Condition {
  Never = 0b000,
  Equal = 0b001,
  Less = 0b010,
  LessEqual = 0b011,
  Greater = 0b100,
  GreaterEqual = 0b101,
  NotEqual = 0b110,
  Always = 0b111,
}
impl Condition {
  fn from_u32(bits: u32) -> Self {
    match bits {
      0b000 => Self::Never,
      0b001 => Self::Equal,
      0b010 => Self::Less,
      0b011 => Self::LessEqual,
      0b100 => Self::Greater,
      0b101 => Self::GreaterEqual,
      0b110 => Self::NotEqual,
      0b111 => Self::Always,
      _ => panic!("Invalid condition bits: {}", bits),
    }
  }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
#[derive(Serialize, Deserialize)]
#[repr(u8)]
pub(crate) enum OperationKind {
  Add = 0,
  Mul = 1,
  Div = 2,
  Mod = 3,
  BitAnd = 4,
  BitOr = 5,
  BitXor = 6,
  Max = 7,
}
impl OperationKind {
  fn from_u32(bits: u32) -> Self {
    match bits {
      0 => Self::Add,
      1 => Self::Mul,
      2 => Self::Div,
      3 => Self::Mod,
      4 => Self::BitAnd,
      5 => Self::BitOr,
      6 => Self::BitXor,
      7 => Self::Max,
      _ => panic!("Invalid operation kind bits: {}", bits),
    }
  }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
#[derive(Serialize, Deserialize)]
#[repr(u8)]
pub(crate) enum ControlFlow {
  None = 0b000,
  Write = 0b001,
  Call = 0b011,
  Ret = 0b100,
}
impl ControlFlow {
  fn from_u32(bits: u32) -> Self {
    match bits {
      0b000 => Self::None,
      0b001 => Self::Write,
      0b011 => Self::Call,
      0b100 => Self::Ret,
      _ => panic!("Invalid control flow bits: {}", bits),
    }
  }
}
