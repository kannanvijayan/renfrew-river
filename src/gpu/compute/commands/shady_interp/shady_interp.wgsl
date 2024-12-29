
// LIBRARY(shady_vm)
/**
 * The shady VM is a small virtual machine that runs inside a shader.
 *
 * The machine uses a register file of 256 32-bit registers, of which the
 * first 240 are general purpose.  The remaining are reserved for special
 * purposes.
 * ```
 * Register file:
 *   r0-r239: 240 x 32-bit registers
 *
 * Special registers:
 *   r240: vm id
 *   r241: program counter
 *   r242-248: UNUSED
 * 
 *   r249: call-stack register 3
 *   r250: call-stack register 2
 *   r251: call-stack register 1
 *   r252: call-stack register 0
 *   r253-255: UNUSED
 * ```
 */

/** General config. */
const SHADY_REG_COUNT: u32 = 256u;

/**
 * The register file.
 */
struct ShadyRegisterFile {
  regs: array<i32, SHADY_REG_COUNT>,
}

const SHADY_REG_VMID: u32 = 240u;
const SHADY_REG_PC: u32 = 241u;

const SHADY_REG_CALLSTACK_0: u32 = 252u;
const SHADY_REG_CALLSTACK_1: u32 = 251u;
const SHADY_REG_CALLSTACK_2: u32 = 250u;
const SHADY_REG_CALLSTACK_3: u32 = 249u;

/*
 *
 * Instructions are 64 bits wide, and can be thought of being composed of
 * four 16-bit parts: the "operation", "destination", and two "source" parts.
 *
 * Depending on the operation bits, the sources may be interpreted as either
 * immediate values or register indices.
 *
 * Control flow is accomplished by writing to the program counter register.
 *
 * Immediate loads of 32-bit constants are done by specifying both source parts
 * as immediate, setting the 'K' bit to shift the second source part left by
 * 16 bits, and specifying 'bitor' or 'add' as the operation.
 *
 * Instructions are encoded as 4 16-bit components, with the following layout:
 * ```
 * Instruction = [Operation][Destination][Source 1][Source 2]
 *
 *       COMPONENT    BITS(high to low)
 * ======================================
 *       Operation    ?VVV-?PPP ?KJI-DCCC
 *       Destination  BBBB-BBBN RRRR-RRRR
 *       Source[R]    HHHH-HH?N RRRR-RRRR
 *       Source[I]    IIII-IIII IIII-IIII
 *
 * === Operation ===
 * CCC = Condition flag mask (3 bits)
 *   Bit 0 - Zero flag
 *   Bit 1 - Negative flag
 *   Bit 2 - Positive flag
 *
 * D = Set flags on operation completion (1 bit)
 *
 * I = Treat source 1 as immediate value (1 bit)
 * J = Treat source 2 as immediate value (1 bit)
 * K = Shift source 2 left by 16 bits (after load)
 *
 * PPP = Operation kind (3 bits)
 *   - 000 - Add (see "negate" bit for subtract operation)
 *   - 001 - Multiply
 *   - 010 - Divide
 *   - 011 - Modulus
 *   - 100 - Bitwise AND
 *   - 101 - Bitwise OR
 *   - 110 - Bitwise XOR
 *
 * VVV = control flow bits.
 *   - bit 0 - write-back: tells VM to use the PC register as the destination.
 *   - bit 1 - call: tells VM to push current continuation.
 *   - bit 2 - return: tells VM to pop call stack into current continuation.
 *
 * === Source ===
 *
 * RRRR-RRRR = Register index (7 bits)
 * N = Negate source (1 bit) (applied after shift)
 * HHHHHH = Shift source (6 bits, bias signed: -32 to 31) (applied first)
 *
 * IIII-IIII = Immediate value (16 bits)
 *
 * === Destination ===
 *
 * RRRR-RRRR = Register index (7 bits)
 * N = negate result (1 bit) (applied after bump)
 * BBBBBBB = Bump (add) result by signed value (7 bits)
 * ```
 */

//// Operation: ?VVV-?PPP ?KJI-DCCC

/** Offset and mask to extract the condition flags. */
const SHADY_INS_OP_COND_OFFSET: u32 = 0u;
const SHADY_INS_OP_COND_MASK: u32 = 0x7u;

/** Offset and mask to extract the set flags bit. */
const SHADY_INS_OP_SETFLAGS_OFFSET: u32 = 3u;
const SHADY_INS_OP_SETFLAGS_MASK: u32 = 0x1u;

/** Offset and mask to extract the immediate source 1 bit. */
const SHADY_INS_OP_IMMSRC1_OFFSET: u32 = 4u;
const SHADY_INS_OP_IMMSRC1_MASK: u32 = 0x1u;

/** Offset and mask to extract the immediate source 2 bit. */
const SHADY_INS_OP_IMMSRC2_OFFSET: u32 = 5u;
const SHADY_INS_OP_IMMSRC2_MASK: u32 = 0x1u;

/** Offset and mask to extract the shift-16 source 2 bit. */
const SHADY_INS_OP_SHIFT16_OFFSET: u32 = 6u;
const SHADY_INS_OP_SHIFT16_MASK: u32 = 0x1u;

/** Offset and mask to extract the operation kind. */
const SHADY_INS_OP_KIND_OFFSET: u32 = 8u;
const SHADY_INS_OP_KIND_MASK: u32 = 0x7u;

/** Offset and mask to extract the control flow bits. */
const SHADY_INS_OP_CFLOW_OFFSET: u32 = 12u;
const SHADY_INS_OP_CFLOW_MASK: u32 = 0x7u;

//// Destination: BBBB-BBBN RRRR-RRRR

/** Offset and mask to extract the destination register. */
const SHADY_INS_DST_REG_OFFSET: u32 = 0u;
const SHADY_INS_DST_REG_MASK: u32 = 0xFFu;

/** Offset and mask to extract the negate result bit. */
const SHADY_INS_DST_NEGATE_OFFSET: u32 = 8u;
const SHADY_INS_DST_NEGATE_MASK: u32 = 0x1u;

/** Offset and mask to extract the bump value. */
const SHADY_INS_DST_BUMP_OFFSET: u32 = 9u;
const SHADY_INS_DST_BUMP_MASK: u32 = 0x7Fu;

//// Source: HHHH-HH?N RRRR-RRRR

/** Offset and mask to extract the source register. */
const SHADY_INS_SRC_REG_OFFSET: u32 = 0u;
const SHADY_INS_SRC_REG_MASK: u32 = 0xFFu;

/** Offset and mask to extract the negate source bit. */
const SHADY_INS_SRC_NEGATE_OFFSET: u32 = 8u;
const SHADY_INS_SRC_NEGATE_MASK: u32 = 0x1u;

/** Offset and mask to extract the shift amount. */
const SHADY_INS_SRC_SHIFT_OFFSET: u32 = 10u;
const SHADY_INS_SRC_SHIFT_MASK: u32 = 0x3Fu;

const SHADY_INS_SRC_SHIFT_BIAS: i32 = -32i;
const SHADY_INS_DST_BUMP_BIAS: i32 = -64i;

/** Opcode definitions. */
const SHADY_OPCODE_ADD: u32 = 0u;
const SHADY_OPCODE_MUL: u32 = 1u;
const SHADY_OPCODE_DIV: u32 = 2u;
const SHADY_OPCODE_MOD: u32 = 3u;
const SHADY_OPCODE_BITAND: u32 = 4u;
const SHADY_OPCODE_BITOR: u32 = 5u;
const SHADY_OPCODE_BITXOR: u32 = 6u;
const SHADY_OPCODE_MAX: u32 = 7u;

/** Condition flag definitions. */
const SHADY_COND_ZERO: u32 = 1u;
const SHADY_COND_NEG: u32 = 2u;
const SHADY_COND_POS: u32 = 4u;

/** Control flow definitions. */
const SHADY_CFLOW_WRITE_BIT: u32 = 0u;
const SHADY_CFLOW_CALL_BIT: u32 = 1u;
const SHADY_CFLOW_RET_BIT: u32 = 2u;


/** The in-memory instruction representation.  */
struct ShadyInstruction {
  op: u32,
  dst: u32,
  src1: u32,
  src2: u32,
}

/** The in-buffer instruction representation. */
struct ShadyBufferInstruction {
  parts: vec2<u32>,
}

fn shady_instruction_from_buffer(bufins: ShadyBufferInstruction) -> ShadyInstruction {
  let low_parts = bufins.parts & 0xFFFFu;
  let high_parts = bufins.parts >> 16u;
  var ins: ShadyInstruction;
  ins.op = low_parts.x;
  ins.dst = high_parts.x;
  ins.src1 = low_parts.y;
  ins.src2 = high_parts.y;
  return ins;
}

fn shady_instruction_to_buffer(ins: ShadyInstruction) -> ShadyBufferInstruction {
  var bufins: ShadyBufferInstruction;
  bufins.parts = vec2<u32>(
    ins.op | (ins.dst << 16u),
    ins.src1 | (ins.src2 << 16u)
  );
  return bufins;
}

/** Extract the operation kind from the instruction.  */
fn shady_ins_op_kind(ins: ShadyInstruction) -> u32 {
  return (ins.op >> SHADY_INS_OP_KIND_OFFSET) & SHADY_INS_OP_KIND_MASK;
}

/** Extract the condition flags from the instruction.  */
fn shady_ins_op_cond(ins: ShadyInstruction) -> u32 {
  return (ins.op >> SHADY_INS_OP_COND_OFFSET) & SHADY_INS_OP_COND_MASK;
}

/** Extract the set flags bit from the instruction.  */
fn shady_ins_op_setflags(ins: ShadyInstruction) -> bool {
  return bool((ins.op >> SHADY_INS_OP_SETFLAGS_OFFSET) & SHADY_INS_OP_SETFLAGS_MASK);
}

/** Extract the immediate source 1 bit from the instruction.  */
fn shady_ins_op_immsrc1(ins: ShadyInstruction) -> bool {
  return bool((ins.op >> SHADY_INS_OP_IMMSRC1_OFFSET) & SHADY_INS_OP_IMMSRC1_MASK);
}

/** Extract the immediate source 2 bit from the instruction.  */
fn shady_ins_op_immsrc2(ins: ShadyInstruction) -> bool {
  return bool((ins.op >> SHADY_INS_OP_IMMSRC2_OFFSET) & SHADY_INS_OP_IMMSRC2_MASK);
}

/** Extract the shift-16 source 2 bit from the instruction.  */
fn shady_ins_op_shift16(ins: ShadyInstruction) -> bool {
  return bool((ins.op >> SHADY_INS_OP_SHIFT16_OFFSET) & SHADY_INS_OP_SHIFT16_MASK);
}

/** Extract the control flow bits from the instruction.  */
fn shady_ins_op_cflow(ins: ShadyInstruction) -> u32 {
  return (ins.op >> SHADY_INS_OP_CFLOW_OFFSET) & SHADY_INS_OP_CFLOW_MASK;
}

//// Destination: BBBB-BBBN RRRR-RRRR

/** Extract the destination register from the instruction.  */
fn shady_ins_dstword_reg(dst_word: u32) -> u32 {
  return (dst_word >> SHADY_INS_DST_REG_OFFSET) & SHADY_INS_DST_REG_MASK;
}

/** Extract the negate result bit from the instruction.  */
fn shady_ins_dstword_negate(dst_word: u32) -> bool {
  return bool(
    (dst_word >> SHADY_INS_DST_NEGATE_OFFSET) & SHADY_INS_DST_NEGATE_MASK
  );
}

/** Extract the bump value from the instruction.  */
fn shady_ins_dstword_bump(dst_word: u32) -> i32 {
  let uval = (dst_word >> SHADY_INS_DST_BUMP_OFFSET) & SHADY_INS_DST_BUMP_MASK;
  return i32(uval) + SHADY_INS_DST_BUMP_BIAS;
}

//// Source: HHHH-HH?N RRRR-RRRR

/** Extract the source register from the instruction.  */
fn shady_ins_srcword_reg(src_word: u32) -> u32 {
  return (src_word >> SHADY_INS_SRC_REG_OFFSET) & SHADY_INS_SRC_REG_MASK;
}

/** Extract the negate source bit from the instruction.  */
fn shady_ins_srcword_negate(src_word: u32) -> bool {
  return bool(
    (src_word >> SHADY_INS_SRC_NEGATE_OFFSET) & SHADY_INS_SRC_NEGATE_MASK
  );
}

/** Extract the shift amount from the instruction.  */
fn shady_ins_srcword_shift(src_word: u32) -> i32 {
  let uval = (src_word >> SHADY_INS_SRC_SHIFT_OFFSET) & SHADY_INS_SRC_SHIFT_MASK;
  return i32(uval) + SHADY_INS_SRC_SHIFT_BIAS;
}


/** Inflate a source word into a ShadySrcReg.  */
fn shady_src_reg_from_word(src_word: u32) -> ShadySrcReg {
  var src_reg: ShadySrcReg;
  src_reg.reg = shady_ins_srcword_reg(src_word);
  src_reg.negate = shady_ins_srcword_negate(src_word);
  src_reg.shift = shady_ins_srcword_shift(src_word);
  return src_reg;
}

/** In-memory source register representation. */
struct ShadySrcReg {
  reg: u32,
  negate: bool,
  shift: i32,
}

/** Use a ShadySrcReg to process a register value. */
fn shady_src_reg_process(src_reg: ShadySrcReg, regval: i32) -> i32 {
  var val = regval;
  if (src_reg.shift >= 0) {
    val = val << u32(src_reg.shift);
  } else {
    val = val >> u32(-src_reg.shift);
  }
  if (src_reg.negate) {
    val = -val;
  }
  return val;
}

/** In-memory destination register representation. */
struct ShadyDstReg {
  reg: u32,
  negate: bool,
  bump: i32,
}

/** Inflate a destination word into a ShadyDstReg.  */
fn shady_dst_reg_from_word(dst_word: u32) -> ShadyDstReg {
  var dst_reg: ShadyDstReg;
  dst_reg.reg = shady_ins_dstword_reg(dst_word);
  dst_reg.negate = shady_ins_dstword_negate(dst_word);
  dst_reg.bump = shady_ins_dstword_bump(dst_word);
  return dst_reg;
}

/**
 * The VM state.
 * Held in private memory, this does not include the register state which
 * is held in a buffer.
 */
struct ShadyMachineState {
  vm_id: u32,
  pc: u32,
  flags: u32,
  call_depth: u32,
  call_stack: array<u32, 4>,
}

alias ShadyMachineStatePtr = ptr<private, ShadyMachineState>;

fn shady_machine_state_new(vm_id: u32, pc: u32) -> ShadyMachineState {
  var state: ShadyMachineState;
  state.vm_id = vm_id;
  state.pc = pc;
  state.flags = 0x7u;
  state.call_depth = 0u;
  state.call_stack = array<u32, 4>(0u, 0u, 0u, 0u);
  return state;
}

fn shady_machine_state_push_call(state_ptr: ShadyMachineStatePtr) {
  let call_depth = (*state_ptr).call_depth;
  if (call_depth >= 4u) {
    // TODO: Log an error somehow.
    return;
  }
  let return_pc = (*state_ptr).pc + 1u;
  (*state_ptr).call_stack[call_depth] = return_pc;
  (*state_ptr).call_depth = call_depth + 1u;
}

fn shady_machine_state_pop_ret(state_ptr: ShadyMachineStatePtr) {
  let call_depth = (*state_ptr).call_depth;
  if (call_depth == 0u) {
    // TODO: Log an error somehow.
    return;
  }
  let return_pc = (*state_ptr).call_stack[call_depth - 1u];
  (*state_ptr).call_depth = call_depth - 1u;
  (*state_ptr).pc = return_pc;
}
// END_LIBRARY(shady_vm)

struct Uniforms {
  vm_count: u32,
  ins_count: u32,
};

@group(0) @binding(0)
var<uniform> uniforms: Uniforms;

@group(0) @binding(1)
var<storage, read> program_buffer: array<ShadyBufferInstruction>;

@group(0) @binding(2)
var<storage, read> start_pc_buffer: array<u32>;

@group(0) @binding(3)
var<storage, write> end_pc_buffer: array<u32>;

@group(0) @binding(4)
var<storage, read_write> register_file_buffer: array<ShadyRegisterFile>;

var<private> machine_state: ShadyMachineState;

@compute
@workgroup_size(16)
fn execute_instructions(
  @builtin(global_invocation_id) global_id: vec3<u32>
) {
  let vm_id: u32 = global_id.x;
  if (vm_id >= uniforms.vm_count) {
    return;
  }

  machine_state = shady_machine_state_new(vm_id, start_pc_buffer[vm_id]);
  vm_set_reg(SHADY_REG_VMID, i32(vm_id));

  let ins_count: u32 = uniforms.ins_count; 
  for (var i: u32 = 0u; i < ins_count; i++) {
    if (i >= ins_count) {
      break;
    }
    invoke_instruction();
  }

  end_pc_buffer[vm_id] = machine_state.pc;
}

fn invoke_instruction() {
  let ins = progbuf_get_ins(machine_state.pc);

  // Check the condition flags.
  let flags = machine_state.flags;
  vm_set_reg(0u, i32(flags));
  if ((flags & shady_ins_op_cond(ins)) == 0u) {
    return;
  }

  // Write the current PC to the PC register.
  vm_set_reg(SHADY_REG_PC, i32(machine_state.pc));

  // Compute source operand values.
  var src1_val: i32 = extractBits(i32(ins.src1), 0u, 16u);
  if ! shady_ins_op_immsrc1(ins) {
    let src1_reg = shady_src_reg_from_word(ins.src1);
    src1_val = shady_src_reg_process(src1_reg, vm_get_reg(src1_reg.reg));
  }

  var src2_val: i32 = extractBits(i32(ins.src2), 0u, 16u);
  if ! shady_ins_op_immsrc2(ins) {
    let src2_reg = shady_src_reg_from_word(ins.src2);
    src2_val = shady_src_reg_process(src2_reg, vm_get_reg(src2_reg.reg));
    vm_set_reg(0u, i32(5555));
    return;
  }

  if shady_ins_op_shift16(ins) {
    src1_val = i32(u32(src1_val) & 0xFFFFu);
    src2_val = src2_val << 16u;
  }

  // Perform operation.
  let op_kind = shady_ins_op_kind(ins);
  var result: i32 = 0i;
  if (op_kind == SHADY_OPCODE_ADD) {
    result = src1_val + src2_val;
  } else if (op_kind == SHADY_OPCODE_MUL) {
    result = src1_val * src2_val;
  } else if (op_kind == SHADY_OPCODE_DIV) {
    result = src1_val / src2_val;
  } else if (op_kind == SHADY_OPCODE_MOD) {
    result = src1_val % src2_val;
  } else if (op_kind == SHADY_OPCODE_BITAND) {
    result = src1_val & src2_val;
  } else if (op_kind == SHADY_OPCODE_BITOR) {
    result = src1_val | src2_val;
  } else if (op_kind == SHADY_OPCODE_BITXOR) {
    result = src1_val ^ src2_val;
  } else { // if (op_kind == SHADY_OPCODE_MAX)
    result = max(src1_val, src2_val);
  }

  // Apply destination processing.
  let dst_reg = shady_dst_reg_from_word(ins.dst);
  result = result + dst_reg.bump;
  if dst_reg.negate {
    result = -result;
  }

  // Write result to destination register.
  vm_set_reg(dst_reg.reg, result);

  // Set flags if necessary.
  if shady_ins_op_setflags(ins) {
    var flags: u32 = 0u;
    if result == 0i {
      flags = flags | SHADY_COND_ZERO;
    }
    if result < 0i {
      flags = flags | SHADY_COND_NEG;
    }
    if result > 0i {
      flags = flags | SHADY_COND_POS;
    }
    machine_state.flags = flags;
  }

  // Handle control flow.
  var target_pc = machine_state.pc + 1u;
  let cflow = shady_ins_op_cflow(ins);
  if ((cflow & SHADY_CFLOW_WRITE_BIT) != 0u) {
    target_pc = u32(vm_get_reg(SHADY_REG_PC));
  }
  if ((cflow & SHADY_CFLOW_CALL_BIT) != 0u) {
    shady_machine_state_push_call(&machine_state);
  }
  if ((cflow & SHADY_CFLOW_RET_BIT) != 0u) {
    shady_machine_state_pop_ret(&machine_state);
  }
  machine_state.pc = target_pc;
}

fn vm_get_reg(reg: u32) -> i32 {
  return register_file_buffer[machine_state.vm_id].regs[reg];
}
fn vm_set_reg(reg: u32, val: i32) {
  register_file_buffer[machine_state.vm_id].regs[reg] = val;
}

fn progbuf_get_ins(pc: u32) -> ShadyInstruction {
  return shady_instruction_from_buffer(program_buffer[pc]);
}
