
/** Offset and mask to extract the instruction family. */
const SHADY_BCOP_OFFSET_INSFAM: u32 = 0u;
const SHADY_BCOP_MASK_INSFAM: u32 = 0x3u;
fn shady_bcop_ins_get_insfam(bcop: u32) -> u32 {
  return (bcop >> SHADY_BCOP_OFFSET_INSFAM) & SHADY_BCOP_MASK_INSFAM;
}

/** Offset and mask to extract the instruction kind. */
const SHADY_BCOP_OFFSET_KIND: u32 = 2u;
const SHADY_BCOP_MASK_KIND: u32 = 0x3u;
fn shady_bcop_ins_get_kind(bcop: u32) -> u32 {
  return (bcop >> SHADY_BCOP_OFFSET_KIND) & SHADY_BCOP_MASK_KIND;
}

/** Offset and mask to extract the destination register. */
const SHADY_BCOP_OFFSET_DSTREG: u32 = 4u;
const SHADY_BCOP_MASK_DSTREG: u32 = 0x1Fu;
fn shady_bcop_ins_get_dstreg(bcop: u32) -> u32 {
  return (bcop >> SHADY_BCOP_OFFSET_DSTREG) & SHADY_BCOP_MASK_DSTREG;
}

/** Offset and mask to extract the flip bit. */
const SHADY_BCOP_OFFSET_FLIP: u32 = 11u;
const SHADY_BCOP_MASK_FLIP: u32 = 0x1u;
fn shady_bcop_ins_get_flip(bcop: u32) -> u32 {
  return (bcop >> SHADY_BCOP_OFFSET_FLIP) & SHADY_BCOP_MASK_FLIP;
}

/** Offset and mask to extract the negate bit. */
const SHADY_BCOP_OFFSET_NEGATE: u32 = 12u;
const SHADY_BCOP_MASK_NEGATE: u32 = 0x1u;
fn shady_bcop_ins_get_negate(bcop: u32) -> u32 {
  return (bcop >> SHADY_BCOP_OFFSET_NEGATE) & SHADY_BCOP_MASK_NEGATE;
}

/** Offset and mask to extract the sign-extend bit. */
const SHADY_BCOP_OFFSET_SX: u32 = 13u;
const SHADY_BCOP_MASK_SX: u32 = 0x1u;
fn shady_bcop_ins_get_sx(bcop: u32) -> u32 {
  return (bcop >> SHADY_BCOP_OFFSET_SX) & SHADY_BCOP_MASK_SX;
}

/** Offset and mask to extract the src mask amount. */
const SHADY_BCOP_OFFSET_SRCMASK: u32 = 14u;
const SHADY_BCOP_MASK_SRCMASK: u32 = 0x7u;
fn shady_bcop_ins_get_srcmask(bcop: u32) -> u32 {
  return (bcop >> SHADY_BCOP_OFFSET_SRCMASK) & SHADY_BCOP_MASK_SRCMASK;
}

/** Offset and mask to extract the src shift amount. */
const SHADY_BCOP_OFFSET_SRCRSH: u32 = 17u;
const SHADY_BCOP_MASK_SRCRSH: u32 = 0x7u;
fn shady_bcop_ins_get_srcrsh(bcop: u32) -> u32 {
  return (bcop >> SHADY_BCOP_OFFSET_SRCRSH) & SHADY_BCOP_MASK_SRCRSH;
}

/** Offset and mask to extract the src register 2. */
const SHADY_BCOP_OFFSET_SRCREG2: u32 = 20u;
const SHADY_BCOP_MASK_SRCREG2: u32 = 0x7Fu;
fn shady_bcop_ins_get_srcreg2(bcop: u32) -> u32 {
  return (bcop >> SHADY_BCOP_OFFSET_SRCREG2) & SHADY_BCOP_MASK_SRCREG2;
}

/** Offset and mask to extract the src register 1. */
const SHADY_BCOP_OFFSET_SRCREG1: u32 = 27u;
const SHADY_BCOP_MASK_SRCREG1: u32 = 0x1Fu;
fn shady_bcop_ins_get_srcreg1(bcop: u32) -> u32 {
  return (bcop >> SHADY_BCOP_OFFSET_SRCREG1) & SHADY_BCOP_MASK_SRCREG1;
}

/** Offset and mask to extract the immediate left-shift amount. */
const SHADY_BCOP_OFFSET_IMMLSH: u32 = 9u;
const SHADY_BCOP_MASK_IMMLSH: u32 = 0x7u;
fn shady_bcop_ins_get_immlsh(bcop: u32) -> u32 {
  return (bcop >> SHADY_BCOP_OFFSET_IMMLSH) & SHADY_BCOP_MASK_IMMLSH;
}

/** Offset and mask to extract the immediate value. */
const SHADY_BCOP_OFFSET_IMMVAL: u32 = 16u;
const SHADY_BCOP_MASK_IMMVAL: u32 = 0xFFFFu;
fn shady_bcop_ins_get_immval(bcop: u32) -> u32 {
  return (bcop >> SHADY_BCOP_OFFSET_IMMVAL) & SHADY_BCOP_MASK_IMMVAL;
}

/** Offset and mask to extract the branch target. */
const SHADY_BCOP_OFFSET_BRTARG: u32 = 16u;
const SHADY_BCOP_MASK_BRTARG: u32 = 0xFFFFu;
fn shady_bcop_ins_get_brtarg(bcop: u32) -> u32 {
  return (bcop >> SHADY_BCOP_OFFSET_BRTARG) & SHADY_BCOP_MASK_BRTARG;
}

/** Offset and mask to extract the branch condition flags. */
const SHADY_BCOP_OFFSET_BRFLAGS: u32 = 8u;
const SHADY_BCOP_MASK_BRFLAGS: u32 = 0xFFu;
fn shady_bcop_ins_get_brflags(bcop: u32) -> u32 {
  return (bcop >> SHADY_BCOP_OFFSET_BRFLAGS) & SHADY_BCOP_MASK_BRFLAGS;
}

/** Offset and mask to extract the branch flags query kind. */
const SHADY_BCOP_OFFSET_BRQUERY: u32 = 7u;
const SHADY_BCOP_MASK_BRQUERY: u32 = 0x1u;
fn shady_bcop_ins_get_brquery(bcop: u32) -> u32 {
  return (bcop >> SHADY_BCOP_OFFSET_BRQUERY) & SHADY_BCOP_MASK_BRQUERY;
}

/** Instruction family code. */
const SHADY_BCOP_INS_ARITH: u32 = 1u;
const SHADY_BCOP_INS_IMMED: u32 = 2u;
const SHADY_BCOP_INS_CFLOW: u32 = 3u;

/** Arithmetic instruction kinds. */
const SHADY_BCOP_INS_ARITH_KIND_ADD: u32 = 0u;
const SHADY_BCOP_INS_ARITH_KIND_MUL: u32 = 1u;
const SHADY_BCOP_INS_ARITH_KIND_DIV: u32 = 2u;
const SHADY_BCOP_INS_ARITH_KIND_MOD: u32 = 3u;

/** Immediate instruction kinds. */
const SHADY_BCOP_INS_IMMED_KIND_SET: u32 = 0u;
const SHADY_BCOP_INS_IMMED_KIND_XOR: u32 = 1u;
const SHADY_BCOP_INS_IMMED_KIND_AND: u32 = 2u;
const SHADY_BCOP_INS_IMMED_KIND_OR: u32 = 3u;

/** Control flow instruction kinds. */
const SHADY_BCOP_INS_CFLOW_KIND_GOTO: u32 = 0u;
const SHADY_BCOP_INS_CFLOW_KIND_CALL: u32 = 1u;
const SHADY_BCOP_INS_CFLOW_KIND_RET: u32 = 2u;
const SHADY_BCOP_INS_CFLOW_KIND_END: u32 = 3u;

/** Flags query kinds. */
const SHADY_BCOP_CFLOW_QUERY_ALL: u32 = 0u;
const SHADY_BCOP_CFLOW_QUERY_ANY: u32 = 1u;

/** Flags bit meanings. */
const SHADY_BCOP_FLAGS_BIT_ZERO: u32 = 1u;
const SHADY_BCOP_FLAGS_BIT_NEGATIVE: u32 = 2u;
const SHADY_BCOP_FLAGS_BIT_POSITIVE: u32 = 4u;
const SHADY_BCOP_FLAGS_BIT_HIGH: u32 = 8u;
const SHADY_BCOP_FLAGS_BIT_ALWAYS: u32 = 16u;

/** Offsets of special registers. */
const SHADY_REG_OFFSET_PC: u32 = 96u;
const SHADY_REG_OFFSET_FL: u32 = 97u;
const SHADY_REG_OFFSET_CD: u32 = 98u;
const SHADY_REG_OFFSET_EC: u32 = 99u;

/** Start offset of the call stack. (callstack grows down)  */
const SHADY_CALLSTACK_OFFSET: u32 = 127u;
const SHADY_CALLDEPTH_MAX: u32 = 4u;

/** Error codes. */
const SHADY_EC_NONE: u32 = 0u;
const SHADY_EC_INVALID_INSTRUCTION: u32 = 1u;
const SHADY_EC_CALLSTACK_OVERFLOW: u32 = 2u;
const SHADY_EC_CALLSTACK_UNDERFLOW: u32 = 3u;
const SHADY_EC_SANITY: u32 = 4u;

/** PC that marks the end of the program. */
const SHADY_PC_END: u32 = 0xFFFFFFFFu;