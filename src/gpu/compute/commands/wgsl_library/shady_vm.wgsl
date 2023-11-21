/** Offset and mask of condition. */
const SHADY_INSFL_COND_OFFSET: u32 = 0u;
const SHADY_INSFL_COND_MASK: u32 = 0x7u;
fn shady_insfl_get_cond(insfl: u32) -> u32 {
  return (insfl >> SHADY_INSFL_COND_OFFSET) & SHADY_INSFL_COND_MASK;
}

/** Offset and mask of X0. */
const SHADY_INSFL_X0_OFFSET: u32 = 3u;
const SHADY_INSFL_X0_MASK: u32 = 0x3Fu;
fn shady_insfl_get_x0(insfl: u32) -> u32 {
  return (insfl >> SHADY_INSFL_X0_OFFSET) & SHADY_INSFL_X0_MASK;
}

/** Offset and mask of X1. */
const SHADY_INSFL_X1_OFFSET: u32 = 9u;
const SHADY_INSFL_X1_MASK: u32 = 0x3Fu;
fn shady_insfl_get_x1(insfl: u32) -> u32 {
  return (insfl >> SHADY_INSFL_X1_OFFSET) & SHADY_INSFL_X1_MASK;
}

/** Offset and mask of operation */
const SHADY_INSFL_OP_OFFSET: u32 = 15u;
const SHADY_INSFL_OP_MASK: u32 = 0xFu;
fn shady_insfl_get_op(insfl: u32) -> u32 {
  return (insfl >> SHADY_INSFL_OP_OFFSET) & SHADY_INSFL_OP_MASK;
}

/** Offset and mask of X2. */
const SHADY_INSFL_X2_OFFSET: u32 = 19u;
const SHADY_INSFL_X2_MASK: u32 = 0x3Fu;
fn shady_insfl_get_x2(insfl: u32) -> u32 {
  return (insfl >> SHADY_INSFL_X2_OFFSET) & SHADY_INSFL_X2_MASK;
}

/** Offset and mask of data-flow. */
const SHADY_INSFL_DF_OFFSET: u32 = 25u;
const SHADY_INSFL_DF_MASK: u32 = 0x3u;
fn shady_insfl_get_df(insfl: u32) -> u32 {
  return (insfl >> SHADY_INSFL_DF_OFFSET) & SHADY_INSFL_DF_MASK;
}

/** Offset and mask of SetFlags bit. */
const SHADY_INSFL_SETFLAG_OFFSET: u32 = 27u;
const SHADY_INSFL_SETFLAG_MASK: u32 = 0x1u;
fn shady_insfl_get_setflag(insfl: u32) -> u32 {
  return (insfl >> SHADY_INSFL_SETFLAG_OFFSET) & SHADY_INSFL_SETFLAG_MASK;
}

/** Offset and mask of X0 immediate flag. */
const SHADY_INSFL_X0_IMM_OFFSET: u32 = 28u;
const SHADY_INSFL_X0_IMM_MASK: u32 = 0x1u;
fn shady_insfl_get_x0_imm(insfl: u32) -> u32 {
  return (insfl >> SHADY_INSFL_X0_IMM_OFFSET) & SHADY_INSFL_X0_IMM_MASK;
}

/** Offset and mask of X1 immediate flag. */
const SHADY_INSFL_X1_IMM_OFFSET: u32 = 29u;
const SHADY_INSFL_X1_IMM_MASK: u32 = 0x1u;
fn shady_insfl_get_x1_imm(insfl: u32) -> u32 {
  return (insfl >> SHADY_INSFL_X1_IMM_OFFSET) & SHADY_INSFL_X1_IMM_MASK;
}

/** Destination code for control-flow. */
const SHADY_CONTROL_FLOW_DEST: u32 = 63u;

/** Operation kinds. */
const SHADY_OP_IMMED = 0u;
const SHADY_OP_ADD = 1u;
const SHADY_OP_SUB = 2u;
const SHADY_OP_MUL = 3u;
const SHADY_OP_DIV = 4u;
const SHADY_OP_MOD = 5u;
const SHADY_OP_LSH = 6u;
const SHADY_OP_RSH = 7u;
const SHADY_OP_AND = 8u;
const SHADY_OP_OR = 9u;
const SHADY_OP_XOR = 10u;

/** Data-flow kinds. */
const SHADY_DF_MOV = 0u;
const SHADY_DF_READ = 1u;
const SHADY_DF_WRITE = 2u;
const SHADY_DF_WRITE_IMM = 3u;

const SHADY_DF_JUMP = 0u;
const SHADY_DF_CALL = 1u;
const SHADY_DF_RET = 2u;
const SHADY_DF_END = 3u;

/** Error codes. */
const SHADY_EC_NONE: u32 = 0u;
const SHADY_EC_INVALID_INSTRUCTION: u32 = 1u;
const SHADY_EC_CALLSTACK_OVERFLOW: u32 = 2u;
const SHADY_EC_CALLSTACK_UNDERFLOW: u32 = 3u;
const SHADY_EC_SANITY: u32 = 4u;

/** PC that marks the end of the program. */
const SHADY_PC_END: u32 = 0xFFFFFFFFu;

/** Max depth of call stack. */
const SHADY_CALLDEPTH_MAX: u32 = 8u;

/** The return-value register. */
const SHADY_REG_RETURN: u32 = 0u;

/** Flag bit meanings. */
const SHADY_FLAG_BIT_LT: u32 = 0u;
const SHADY_FLAG_BIT_EQ: u32 = 1u;
const SHADY_FLAG_BIT_GT: u32 = 2u;

struct ShadyIns {
  ins: u32,
}
fn shady_ins_get_cond(ins: ShadyIns) -> u32 {
  return shady_insfl_get_cond(ins.ins);
}
fn shady_ins_get_x0(ins: ShadyIns) -> u32 {
  return shady_insfl_get_x0(ins.ins);
}
fn shady_ins_get_x1(ins: ShadyIns) -> u32 {
  return shady_insfl_get_x1(ins.ins);
}
fn shady_ins_get_op(ins: ShadyIns) -> u32 {
  return shady_insfl_get_op(ins.ins);
}
fn shady_ins_get_x2(ins: ShadyIns) -> u32 {
  return shady_insfl_get_x2(ins.ins);
}
fn shady_ins_get_df(ins: ShadyIns) -> u32 {
  return shady_insfl_get_df(ins.ins);
}
fn shady_ins_get_setflag(ins: ShadyIns) -> bool {
  return shady_insfl_get_setflag(ins.ins) != 0u;
}
fn shady_ins_get_x0_imm(ins: ShadyIns) -> bool {
  return shady_insfl_get_x0_imm(ins.ins) != 0u;
}
fn shady_ins_get_x1_imm(ins: ShadyIns) -> bool {
  return shady_insfl_get_x1_imm(ins.ins) != 0u;
}

const SHADY_REGISTER_FILE_MASK: u32 = 0x3Fu;
struct ShadyRegisterFile {
  regs: array<u32, 64>,
}
fn shady_regfile_read(
  regfile: ptr<private, ShadyRegisterFile>,
  reg: u32
) -> u32 {
  return (*regfile).regs[reg & SHADY_REGISTER_FILE_MASK];
}
fn shady_regfile_write(
  regfile: ptr<private, ShadyRegisterFile>,
  reg: u32,
  val: u32
) {
  (*regfile).regs[reg & SHADY_REGISTER_FILE_MASK] = val;
}
fn shady_regfile_set_rval(
  regfile: ptr<private, ShadyRegisterFile>,
  val: u32
) {
  (*regfile).regs[SHADY_REG_RETURN] = val;
}

struct ShadyMemory {
  mem: array<u32, 128>,
}
fn shady_memory_read(
  memory: ptr<private, ShadyMemory>,
  addr: u32
) -> u32 {
  return (*memory).mem[addr];
}
fn shady_memory_write(
  memory: ptr<private, ShadyMemory>,
  addr: u32,
  val: u32
) {
  (*memory).mem[addr] = val;
}

struct ShadyFlags {
  flags: u32,
}
fn shady_flags_test(flags: ptr<private, ShadyFlags>, test: u32) -> bool {
  return ((*flags).flags & test) > 0u;
}
fn shady_flags_set(flags: ptr<private, ShadyFlags>, value: u32) {
  var fl = 0u;
  if value < 0u {
    fl |= (1u << SHADY_FLAG_BIT_LT);
  }
  if value == 0u {
    fl |= (1u << SHADY_FLAG_BIT_EQ);
  }
  if value > 0u {
    fl |= (1u << SHADY_FLAG_BIT_GT);
  }
  (*flags).flags |= fl;
}

struct ShadyProgramCounter {
  pc: u32,
}
fn shady_program_counter_get(pc: ptr<private, ShadyProgramCounter>) -> u32{
  return (*pc).pc;
}
fn shady_program_counter_incr(pc: ptr<private, ShadyProgramCounter>) {
  (*pc).pc = (*pc).pc + 1u;
}
fn shady_program_counter_set(pc: ptr<private, ShadyProgramCounter>, val: u32) {
  (*pc).pc = val;
}
fn shady_program_counter_set_end(pc: ptr<private, ShadyProgramCounter>) {
  (*pc).pc = SHADY_PC_END;
}

struct ShadyCallDepth {
  cd: u32,
}
fn shady_call_depth_get(cd: ptr<private, ShadyCallDepth>) -> u32 {
  return (*cd).cd;
}
fn shady_call_depth_incr(cd: ptr<private, ShadyCallDepth>) {
  (*cd).cd += 1u;
}
fn shady_call_depth_decr(cd: ptr<private, ShadyCallDepth>) {
  (*cd).cd -= 1u;
}

struct ShadyCallStack {
  stack: array<u32, 8>,
}
fn shady_call_stack_enter(
  cs: ptr<private, ShadyCallStack>,
  cd: ptr<private, ShadyCallDepth>,
  ret_pc: u32,
  callee_pc: u32,
  ec: ptr<private, ShadyErrCode>,
) -> u32 {
  let cd_val = shady_call_depth_get(cd);
  if cd_val >= SHADY_CALLDEPTH_MAX {
    shady_err_code_set(ec, SHADY_EC_CALLSTACK_OVERFLOW);
    return SHADY_PC_END;
  }
  (*cs).stack[cd_val] = ret_pc;
  shady_call_depth_incr(cd);
  return callee_pc;
}

fn shady_call_stack_pop(
  cs: ptr<private, ShadyCallStack>,
  cd: ptr<private, ShadyCallDepth>,
  ec: ptr<private, ShadyErrCode>,
) -> u32 {
  let cd_val = shady_call_depth_get(cd);
  if cd_val == 0u {
    shady_err_code_set(ec, SHADY_EC_CALLSTACK_UNDERFLOW);
    return SHADY_PC_END;
  }
  let retaddr = (*cs).stack[cd_val];
  shady_call_depth_decr(cd);
  return retaddr;
}

struct ShadyErrCode {
  ec: u32,
}
fn shady_err_code_set(err: ptr<private, ShadyErrCode>, ec: u32) {
  (*err).ec = ec;
}

/** Execute an instruction. */
fn shady_ins_exec(
  ins: ShadyIns,
  regfile: ptr<private, ShadyRegisterFile>,
  memory: ptr<private, ShadyMemory>,
  flags: ptr<private, ShadyFlags>,
  pc: ptr<private, ShadyProgramCounter>,
  cd: ptr<private, ShadyCallDepth>,
  cs: ptr<private, ShadyCallStack>,
  err: ptr<private, ShadyErrCode>,
) {
  // Check condition.
  let cond = shady_ins_get_cond(ins);
  if ! shady_flags_test(flags, cond) {
    shady_program_counter_incr(pc);
    return;
  }

  // Read x0 and x1 operands.
  let x0 = shady_ins_get_x0(ins);
  let x1 = shady_ins_get_x1(ins);

  // Read x0 and x1 immediate flags.
  let x0_imm = shady_ins_get_x0_imm(ins);
  let x1_imm = shady_ins_get_x1_imm(ins);

  // Compute v0 and v1
  var v0 = x0;
  if !x0_imm {
    v0 = shady_regfile_read(regfile, x0);
  }

  var v1 = x1;
  if !x1_imm {
    v1 = shady_regfile_read(regfile, x1);
  }

  // Perform binop
  var result = 0u;
  let op = shady_ins_get_op(ins);
  if op == SHADY_OP_IMMED {
    result = (v0 << 6u) | v1;
  } else if op == SHADY_OP_ADD {
    result = v0 + v1;
  } else if op == SHADY_OP_SUB {
    result = v0 - v1;
  } else if op == SHADY_OP_MUL {
    result = v0 * v1;
  } else if op == SHADY_OP_DIV {
    result = v0 / v1;
  } else if op == SHADY_OP_MOD {
    result = v0 % v1;
  } else if op == SHADY_OP_LSH {
    result = v0 << v1;
  } else if op == SHADY_OP_RSH {
    result = v0 >> v1;
  } else if op == SHADY_OP_AND {
    result = v0 & v1;
  } else if op == SHADY_OP_OR {
    result = v0 | v1;
  } else if op == SHADY_OP_XOR {
    result = v0 ^ v1;
  } else {
    // Should never get here because of the instruction kind mask.
    shady_err_code_set(err, SHADY_EC_INVALID_INSTRUCTION);
    shady_program_counter_set_end(pc);
    return;
  }

  // Data-Flow or Control-Flow?

  let dest = shady_ins_get_x2(ins);
  let df = shady_ins_get_df(ins);
  var next_pc = shady_program_counter_get(pc) + 1u;
  if dest == SHADY_CONTROL_FLOW_DEST {
    // Control flow instruction.
    if df == SHADY_DF_JUMP {
      next_pc = result;
    } else if df == SHADY_DF_CALL {
      next_pc = shady_call_stack_enter(cs, cd, next_pc, result, err);
    } else if df == SHADY_DF_RET {
      shady_regfile_set_rval(regfile, result);
      next_pc = shady_call_stack_pop(cs, cd, err);
    } else if df == SHADY_DF_END {
      shady_regfile_set_rval(regfile, result);
      next_pc = SHADY_PC_END;
    } else {
      // Should never get here because of the instruction kind mask.
      shady_err_code_set(err, SHADY_EC_INVALID_INSTRUCTION);
      next_pc = SHADY_PC_END;
    }
    shady_program_counter_set(pc, next_pc);
  } else {
    // Data-flow instruction.
    if df == SHADY_DF_MOV {
      shady_regfile_write(regfile, dest, result);
    } else if df == SHADY_DF_READ {
      shady_regfile_write(regfile, dest, shady_memory_read(memory, result));
    } else if df == SHADY_DF_WRITE {
      shady_memory_write(memory, result, shady_regfile_read(regfile, dest));
    } else if df == SHADY_DF_WRITE_IMM {
      shady_memory_write(memory, result, dest);
    } else {
      // Should never get here because of the instruction kind mask.
      shady_err_code_set(err, SHADY_EC_INVALID_INSTRUCTION);
      shady_program_counter_set_end(pc);
    }
  }

  // Update flags.
  if shady_ins_get_setflag(ins) {
    shady_flags_set(flags, result);
  }
}

