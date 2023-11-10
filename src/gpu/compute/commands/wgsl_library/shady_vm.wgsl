/**
 * The shady VM is a small virtual machine that runs inside a shader.
 *
 * The machine uses a register file of 128 32-bit registers.  Of these,
 * the first 16 are universally addressable registers.  The rest are
 * usable as one of the source operands.
 *
 * ```
 * Register file:
 *   r0-r29: 30 x 32-bit registers, read-write general purpose
 *   r30: 1 x 32-bit register, read-only, always zero
 *   r32-r79: 48 x 32-bit registers, only usable as source operands
 *   r80-r96: UNUSED
 *
 * Special registers:
 *   r112: program counter
 *   r113: flags register
 *   r114: call stack depth
 *   r115: error code
 *   r116-123: UNUSED
 * 
 *   r124: call-stack register 3
 *   r125: call-stack register 2
 *   r126: call-stack register 1
 *   r127: call-stack register 0
 * ```
 *
 * Instructions are encoded as 32-bit unsigned integers.
 *
 * ```
 * Instruction encoding:
 *   31                  15                0
 *   XXXX-XXXX XXXX-XXXX XXXX-XXXX XXXX-XXXX
 *
 * Arithmetic operations:
 *   ????-???? ????-???? ????-???? ????-??01
 *
 * Immediate operations:
 *   ????-???? ????-???? ????-???? ????-??10
 *
 * Branch operations:
 *   ????-???? ????-???? ????-???? ????-??11
 *
 * Arithmetic operations:
 *   TTTT-TSSS SSSS-RRRM MMXN-F??D DDDD-KK01
 *   
 *   * TTTTT (5 bits)
 *     - source register 1
 *   * SSSSSSS (7 bits)
 *     - source register 2
 *   * RRR (3 bits)
 *     - source register 2 right-shift amount
 *     - value multiplied by 4 before shift
 *   * MMM (3 bits)
 *     - source register 2 mask specifier
 *     - 0xf, 0xff, 0xfff, 0xffff
 *   * X (1 bit)
 *     - if set, sign-extend the source register 2 value
 *   * N (1 bit)
 *     - if set, negate source register 2 (after flip)
 *   * F (1 bit)
 *     - if set, flip source registers before operation
 *   * DDDDD (5 bits)
 *     - destination register
 *   * KK (2 bits)
 *     - operation kind
 *     - 00 => add, 01 => mul, 10 => divide, 11 => modulo
 *
 * Immediate operations:
 *   VVVV-VVVV VVVV-VVVV ??X?-LLLD DDDD-KK10
 *
 *   * VVV...VVV (16-bits)
 *     - immediate value
 *   * X (1 bit)
 *     - if set, sign-extend the value
 *   * LLL (3 bits)
 *     - immediate value left-shift amount
 *     - value multiplied by 4 before shift
 *   * DDDDD (5 bits)
 *     - destination register
 *   * KK (2 bits)
 *     - accumulation kind
 *     - 00 => set, 01 => xor, 10 => and, 11 => or
 *
 * Control flow operations:
 *   BBBB-BBBB BBBB-BBBB CCCC-CCCC Q???-KK11
 *
 *   * BBBBB...BBBB (16-bits)
 *     - branch target (absolute)
 *   * CCCCCCCC (8 bits)
 *     - condition flags to check
 *   * Q (1 bit)
 *     - flags query kind
 *     - 0 => all flags must be set, 1 => any flag must be set
 *   * KK (2 bits)
 *     - branch kind
 *     - 00 => goto, 01 => call, 10 => return, 11 => end
 * ```
 */

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


/** Access to the register file and call stack. */
struct ShadyRegisterFile {
  regs: array<u32, 128>,
}

/** Initialize private pointers from a pointer to the full struct. */
fn shady_init_ptrs(
  regfile: ptr<private, ShadyRegisterFile>,
  flags: ptr<private, u32>,
  pc: ptr<private, u32>,
  cd: ptr<private, u32>
) {
  *flags = (*regfile).regs[SHADY_REG_OFFSET_FL];
  *pc = (*regfile).regs[SHADY_REG_OFFSET_PC];
  *cd = (*regfile).regs[SHADY_REG_OFFSET_CD];
}

/** Update register file struct. */
fn shady_writeback_ptrs(
  regfile: ptr<private, ShadyRegisterFile>,
  flags: ptr<private, u32>,
  pc: ptr<private, u32>,
  cd: ptr<private, u32>
) {
  (*regfile).regs[SHADY_REG_OFFSET_FL] = *flags;
  (*regfile).regs[SHADY_REG_OFFSET_PC] = *pc;
  (*regfile).regs[SHADY_REG_OFFSET_CD] = *cd;
}

/** Execute an instruction. */
fn shady_ins_exec(
  ins: u32,
  regfile: ptr<private, ShadyRegisterFile>,
  flags: ptr<private, u32>,
  pc: ptr<private, u32>,
  cd: ptr<private, u32>
) -> u32 {
  let fam = shady_bcop_ins_get_insfam(ins);
  let kind = shady_bcop_ins_get_kind(ins);
  if fam == SHADY_BCOP_INS_ARITH {
    return shady_ins_exec_arith(ins, kind, regfile, flags, pc);
  }
  if fam == SHADY_BCOP_INS_IMMED {
    return shady_ins_exec_immed(ins, kind, regfile, flags, pc);
  }
  if fam == SHADY_BCOP_INS_CFLOW {
    return shady_ins_exec_cflow(ins, kind, regfile, flags, pc, cd);
  }
  // Unrecognized instruction family.
  return set_error_and_end(regfile, SHADY_EC_INVALID_INSTRUCTION);
}

/** Execute an arithmetic instruction. */
fn shady_ins_exec_arith(
  ins: u32,
  kind: u32,
  regfile: ptr<private, ShadyRegisterFile>,
  flags: ptr<private, u32>,
  pc: ptr<private, u32>
) -> u32 {
  let srcreg1 = shady_bcop_ins_get_srcreg1(ins);
  let srcreg2 = shady_bcop_ins_get_srcreg2(ins);
  let srcreg2_shift = shady_bcop_ins_get_srcrsh(ins);
  let srcreg2_shift_bits = srcreg2_shift << 2u;
  let srcreg2_mask = shady_bcop_ins_get_srcmask(ins);
  let srcreg2_mask_bits = srcreg2_mask << 2u;
  let srcreg2_mask_val = (1u << srcreg2_mask_bits) - 1u;
  let srcreg2_sx = shady_bcop_ins_get_sx(ins);
  let srcreg2_negate = shady_bcop_ins_get_negate(ins);
  let flip = shady_bcop_ins_get_flip(ins);
  let dstreg = shady_bcop_ins_get_dstreg(ins);

  var srcval1 = (*regfile).regs[srcreg1];

  var srcval2 = (*regfile).regs[srcreg2];
  // Shift and mask.
  srcval2 = (srcval2 >> srcreg2_shift_bits) & srcreg2_mask_val;
  // Use the high-bit to sign extend.
  let srcval2_highbitset = (srcval2 >> (srcreg2_mask_bits - 1u)) & 1u;
  let srcval2_signext = srcreg2_sx & srcval2_highbitset;
  let srcval2_signext_mask = (0u-srcval2_signext) & ~srcreg2_mask_val;
  srcval2 = srcval2 | srcval2_signext_mask;

  // Negate srcval2 if requested.
  if srcreg2_negate > 0u {
    srcval2 = 0u - srcval2;
  }

  // Flip the source registers if requested.
  if flip > 0u {
    let tmp = srcval1;
    srcval1 = srcval2;
    srcval2 = tmp;
  }

  var result = 0u;
  if kind == SHADY_BCOP_INS_ARITH_KIND_ADD {
    result = srcval1 + srcval2;
  } else if kind == SHADY_BCOP_INS_ARITH_KIND_MUL {
    result = srcval1 * srcval2;
  } else if kind == SHADY_BCOP_INS_ARITH_KIND_DIV {
    result = srcval1 / srcval2;
  } else if kind == SHADY_BCOP_INS_ARITH_KIND_MOD {
    result = srcval1 % srcval2;
  } else {
    // Should never get here because of the instruction kind mask.
    return set_error_and_end(regfile, SHADY_EC_SANITY);
  }
  (*regfile).regs[dstreg] = result;

  // Update flags.
  *flags = calculate_flags_word(result);

  // Go to next instruction.
  return *pc + 1u;
}

/** Execute an immediate instruction. */
fn shady_ins_exec_immed(
  ins: u32,
  kind: u32,
  regfile: ptr<private, ShadyRegisterFile>,
  flags: ptr<private, u32>,
  pc: ptr<private, u32>
) -> u32 {
  var immval = shady_bcop_ins_get_immval(ins);
  let immval_sx = shady_bcop_ins_get_sx(ins);
  let immlsh = shady_bcop_ins_get_immlsh(ins);
  let dstreg = shady_bcop_ins_get_dstreg(ins);

  let immval_highbitset = (immval >> 15u) & 1u;
  let immval_signext = immval_sx & immval_highbitset;
  let immval_signext_mask = (0u-immval_signext) & ~0xFFFFu;
  immval = immval | immval_signext_mask;

  let immlsh_bits = immlsh << 2u;
  immval = immval << immlsh_bits;

  var result = (*regfile).regs[dstreg];
  if kind == SHADY_BCOP_INS_IMMED_KIND_SET {
    result = immval;
  } else if kind == SHADY_BCOP_INS_IMMED_KIND_XOR {
    result = result ^ immval;
  } else if kind == SHADY_BCOP_INS_IMMED_KIND_AND {
    result = result & immval;
  } else if kind == SHADY_BCOP_INS_IMMED_KIND_OR {
    result = result | immval;
  } else {
    // Should never get here because of the instruction kind mask.
    return set_error_and_end(regfile, SHADY_EC_SANITY);
  }
  (*regfile).regs[dstreg] = result;

  // Update flags.
  *flags = calculate_flags_word(result);

  // Go to next instruction.
  return *pc + 1u;
}

/** Execute a control flow instruction. */
fn shady_ins_exec_cflow(
  ins: u32,
  kind: u32,
  regfile: ptr<private, ShadyRegisterFile>,
  flags: ptr<private, u32>,
  pc: ptr<private, u32>,
  cd: ptr<private, u32>
) -> u32 {
  let brtarg = shady_bcop_ins_get_brtarg(ins);
  let chk_flags = shady_bcop_ins_get_brflags(ins);
  let query = shady_bcop_ins_get_brquery(ins);

  let flags_val = *flags;
  let flags_set = flags_val & chk_flags;
  let flags_set_all = flags_set == chk_flags;
  let flags_set_any = flags_set > 0u;
  var do_branch = false;
  if query == SHADY_BCOP_CFLOW_QUERY_ALL {
    do_branch = flags_set_all;
  } else {
    do_branch = flags_set_any;
  }

  if ! do_branch {
    return *pc + 1u;
  }

  if kind == SHADY_BCOP_INS_CFLOW_KIND_GOTO {
    return brtarg;
  }
  if kind == SHADY_BCOP_INS_CFLOW_KIND_CALL {
    let cd_val = *cd;
    if cd_val >= SHADY_CALLDEPTH_MAX {
      return set_error_and_end(regfile, SHADY_EC_CALLSTACK_OVERFLOW);
    }
    (*regfile).regs[SHADY_CALLSTACK_OFFSET - cd_val] = *pc + 1u;
    *cd = cd_val + 1u;
    return brtarg;
  }
  if kind == SHADY_BCOP_INS_CFLOW_KIND_RET {
    let cd_val = *cd;
    if cd_val == 0u {
      return set_error_and_end(regfile, SHADY_EC_CALLSTACK_UNDERFLOW);
    }
    let ret_pc = (*regfile).regs[SHADY_CALLSTACK_OFFSET - cd_val];
    *cd = cd_val - 1u;
    return ret_pc;
  }
  if kind == SHADY_BCOP_INS_CFLOW_KIND_END {
    return SHADY_PC_END;
  }
  // Should never get here because of the instruction kind mask.
  return set_error_and_end(regfile, SHADY_EC_SANITY);
}

fn calculate_flags_word(value: u32) -> u32 {
  var flags = SHADY_BCOP_FLAGS_BIT_ALWAYS;
  if value == 0u {
    flags |= SHADY_BCOP_FLAGS_BIT_ZERO;
  }
  if value > 0u {
    flags |= SHADY_BCOP_FLAGS_BIT_POSITIVE;
  }
  if value < 0u {
    flags |= SHADY_BCOP_FLAGS_BIT_NEGATIVE;
  }
  if (value >> 31u) > 0u {
    flags |= SHADY_BCOP_FLAGS_BIT_HIGH;
  }
  return flags;
}

fn set_error_and_end(
  regfile: ptr<private, ShadyRegisterFile>,
  err: u32,
) -> u32 {
  (*regfile).regs[SHADY_REG_OFFSET_EC] = err;
  return SHADY_PC_END;
}