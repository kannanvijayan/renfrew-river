export const SHADY_REG_COUNT = 256;

export const SHADY_REG_LAST_GP = 239;
export const SHADY_REG_VMID = 240;
export const SHADY_REG_PC = 241;

/** Offset and mask to extract the condition flags. */
export const SHADY_INS_OP_COND_OFFSET = 0;
export const SHADY_INS_OP_COND_MASK = 0x7;

/** Offset and mask to extract the set flags bit. */
export const SHADY_INS_OP_SETFLAGS_OFFSET = 3;
export const SHADY_INS_OP_SETFLAGS_MASK = 0x1;

/** Offset and mask to extract the immediate source 1 bit. */
export const SHADY_INS_OP_IMMSRC1_OFFSET = 4;
export const SHADY_INS_OP_IMMSRC1_MASK = 0x1;

/** Offset and mask to extract the immediate source 2 bit. */
export const SHADY_INS_OP_IMMSRC2_OFFSET = 5;
export const SHADY_INS_OP_IMMSRC2_MASK = 0x1;

/** Offset and mask to extract the shift-16 source 2 bit. */
export const SHADY_INS_OP_SHIFT16_OFFSET = 6;
export const SHADY_INS_OP_SHIFT16_MASK = 0x1;

/** Offset and mask to extract the indirect source-1 bit. */
export const SHADY_INS_OP_INDSRC1_OFFSET = 7;
export const SHADY_INS_OP_INDSRC1_MASK = 0x1;

/** Offset and mask to extract the indirect source-2 bit. */
export const SHADY_INS_OP_INDSRC2_OFFSET = 8;
export const SHADY_INS_OP_INDSRC2_MASK = 0x1;

/** Offset and mask to extract the indirect destination bit. */
export const SHADY_INS_OP_INDDST_OFFSET = 9;
export const SHADY_INS_OP_INDDST_MASK = 0x1;

/** Offset and mask to extract the operation kind. */
export const SHADY_INS_OP_KIND_OFFSET = 10;
export const SHADY_INS_OP_KIND_MASK = 0x7;

/** Offset and mask to extract the control flow bits. */
export const SHADY_INS_OP_CFLOW_OFFSET = 13;
export const SHADY_INS_OP_CFLOW_MASK = 0x7;

//// Destination: BBBB-BBBN RRRR-RRRR

/** Offset and mask to extract the destination register. */
export const SHADY_INS_DST_REG_OFFSET = 0;
export const SHADY_INS_DST_REG_MASK = 0xFF;

/** Offset and mask to extract the negate result bit. */
export const SHADY_INS_DST_NEGATE_OFFSET = 8;
export const SHADY_INS_DST_NEGATE_MASK = 0x1;

/** Offset and mask to extract the bump value. */
export const SHADY_INS_DST_BUMP_OFFSET = 9;
export const SHADY_INS_DST_BUMP_MASK = 0x7F;

export const SHADY_INS_DST_BUMP_MAX = (SHADY_INS_DST_BUMP_MASK >> 1)
export const SHADY_INS_DST_BUMP_MIN = SHADY_INS_DST_BUMP_MAX - SHADY_INS_DST_BUMP_MASK;
export const SHADY_INS_DST_BUMP_BIAS = 64;

//// Source: HHHH-HH?N RRRR-RRRR

/** Offset and mask to extract the source register. */
export const SHADY_INS_SRC_REG_OFFSET = 0;
export const SHADY_INS_SRC_REG_MASK = 0xFF;

/** Offset and mask to extract the negate source bit. */
export const SHADY_INS_SRC_NEGATE_OFFSET = 8;
export const SHADY_INS_SRC_NEGATE_MASK = 0x1;

/** Offset and mask to extract the shift amount. */
export const SHADY_INS_SRC_SHIFT_OFFSET = 10;
export const SHADY_INS_SRC_SHIFT_MASK = 0x3F;

export const SHADY_INS_SRC_SHIFT_MAX = SHADY_INS_SRC_SHIFT_MASK >> 1;
export const SHADY_INS_SRC_SHIFT_MIN = SHADY_INS_SRC_SHIFT_MAX - (SHADY_INS_SRC_SHIFT_MASK);
export const SHADY_INS_SRC_SHIFT_BIAS = 32;

/** Opcode definitions. */
export const SHADY_OPCODE_ADD = 0;
export const SHADY_OPCODE_MUL = 1;
export const SHADY_OPCODE_DIV = 2;
export const SHADY_OPCODE_MOD = 3;
export const SHADY_OPCODE_BITAND = 4;
export const SHADY_OPCODE_BITOR = 5;
export const SHADY_OPCODE_BITXOR = 6;
export const SHADY_OPCODE_MAX = 7;

/** Condition flag definitions. */
export const SHADY_COND_ZERO = 1;
export const SHADY_COND_NEG = 2;
export const SHADY_COND_POS = 4;

/** Control flow definitions. */
export const SHADY_CFLOW_WRITE_BIT = 0;
export const SHADY_CFLOW_CALL_BIT = 1;
export const SHADY_CFLOW_RET_BIT = 2;


export enum Condition {
  Never = 0b000,
  Equal = 0b001,
  Less = 0b010,
  LessEqual = 0b011,
  Greater = 0b100,
  GreaterEqual = 0b101,
  NotEqual = 0b110,
  Always = 0b111,
}

export enum OperationKind {
  Add = 0,
  Mul = 1,
  Div = 2,
  Mod = 3,
  BitAnd = 4,
  BitOr = 5,
  BitXor = 6,
  Max = 7,
}

export enum ControlFlow {
  None = 0b000,
  Write = 0b001,
  Call = 0b011,
  Ret = 0b100,
}
