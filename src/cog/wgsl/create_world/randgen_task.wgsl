
// LIBRARY(perlin_gen)

// LIBRARY(xxhash)
fn rot_left(val: vec4<u32>, rot: vec4<u32>) -> vec4<u32> {
  return (val << rot) | (val >> (32u - rot));
}

const XXHASH_PRIME_1: u32 = 2654435761u;
const XXHASH_PRIME_2: u32 = 2246822519u;
const XXHASH_PRIME_3: u32 = 3266489917u;
fn xxhash(seed: u32, values: vec4<u32>) -> u32 {
  let state: vec4<u32> = vec4<u32>(
    seed + XXHASH_PRIME_1 + XXHASH_PRIME_2,
    seed + XXHASH_PRIME_2,
    seed,
    seed - XXHASH_PRIME_1,
  );
  let pre_rotate = (state + values) * XXHASH_PRIME_2;
  let new_state = rot_left(
    rot_left(pre_rotate, vec4<u32>(13u)) * XXHASH_PRIME_1,
    vec4<u32>(1u, 7u, 12u, 18u)
  );

  var res = 16u + new_state[0] + new_state[1] + new_state[2] + new_state[3];
  res = (res ^ (res >> 15u)) * XXHASH_PRIME_2;
  res = (res ^ (res >> 13u)) * XXHASH_PRIME_3;
  return res ^ (res >> 16u);
}
// END_LIBRARY(xxhash)

const PERLIN_OCTAVE_MAX_SCALE: f32 = 5.0;
const PERLIN_OCTAVE_MIN: f32 = 4.0;
const PERLIN_OCTAVE_STEP: f32 = 2.0;
const PERLIN_OCTAVE_CRAGGINESS: f32 = 1.05;

const PERLIN_BORDER_FADE_WIDTH_PERCENT: f32 = 10.0;

const PERLIN_PI: f32 = 3.1415926535897932384626;

fn perlin_swizzle(seed: u32, adjust: u32, x: u32, y: u32) -> f32 {
  let a = xxhash(seed, vec4<u32>(adjust, x, y, 0u));
  return f32(a) / f32(u32(-1));
}

fn perlin_smoother(v: f32) -> f32 {
  // return (v * v) * (3.0 - 2.0 * v);
  return (v * (v * 6.0 - 15.0) + 10.0) * v * v * v;
}

fn perlin_interpolate(start: f32, end: f32, travel: f32) -> f32 {
  return start + (end - start) * perlin_smoother(travel);
}

fn perlin_gridvec(seed: u32, stage: u32, pt: vec2<u32>) -> vec2<f32> {
  let rand_unit = perlin_swizzle(seed, stage, pt.x, pt.y);
  // Multiply by 2pi, then take cos and sin for gridvec dx, dy
  // This gives us a natural unit-vector.
  let angle = rand_unit * 2.0 * PERLIN_PI;
  return vec2<f32>(cos(angle), sin(angle));
}

fn perlin_stage(
  world_dims: vec2<u32>,
  seed: u32,
  stage: u32,
  scale: u32,
  x: u32,
  y: u32,
) -> f32 {
  let pt: vec2<f32> = vec2<f32>(f32(x), f32(y)) / f32(scale);

  let tl: vec2<f32> = floor(pt);
  let tr: vec2<f32> = vec2<f32>(tl.x + 1.0, tl.y);
  let br: vec2<f32> = vec2<f32>(tl.x + 1.0, tl.y + 1.0);
  let bl: vec2<f32> = vec2<f32>(tl.x, tl.y + 1.0);

  var tl_vec: vec2<f32> = perlin_gridvec(seed, stage, vec2<u32>(tl));
  var tr_vec: vec2<f32> = perlin_gridvec(seed, stage, vec2<u32>(tr));
  var br_vec: vec2<f32> = perlin_gridvec(seed, stage, vec2<u32>(br));
  var bl_vec: vec2<f32> = perlin_gridvec(seed, stage, vec2<u32>(bl));

  var keep_y: f32 = 1.0;
  let fade_border_y = u32(
    f32(world_dims[1]) * (PERLIN_BORDER_FADE_WIDTH_PERCENT / 100.0)
  );
  if (y < fade_border_y) {
    keep_y = f32(y) / f32(fade_border_y);
  }
  if (y > (world_dims[1] - fade_border_y)) {
    keep_y = f32(world_dims[1] - y) / f32(fade_border_y);
  }

  var keep_x: f32 = 1.0;
  let fade_border_x = u32(
    f32(world_dims[0]) * (PERLIN_BORDER_FADE_WIDTH_PERCENT / 100.0)
  );
  if (x < fade_border_x) {
    keep_x = f32(x) / f32(fade_border_x);
  }
  if (x > (world_dims[0] - fade_border_x)) {
    keep_x = f32(world_dims[0] - x) / f32(fade_border_x);
  }

  let pt_tl = pt - tl;
  let pt_tr = pt - tr;
  let pt_br = pt - br;
  let pt_bl = pt - bl;

  let sink = max(1.0 - keep_x, 1.0 - keep_y);
  tl_vec = vec2(
    perlin_interpolate(tl_vec.x, -pt_tl.x, sink),
    perlin_interpolate(tl_vec.y, -pt_tl.y, sink),
  );
  tr_vec = vec2(
    perlin_interpolate(tr_vec.x, -pt_tr.x, sink),
    perlin_interpolate(tr_vec.y, -pt_tr.y, sink),
  );
  br_vec = vec2(
    perlin_interpolate(br_vec.x, -pt_br.x, sink),
    perlin_interpolate(br_vec.y, -pt_br.y, sink),
  );
  bl_vec = vec2(
    perlin_interpolate(bl_vec.x, -pt_bl.x, sink),
    perlin_interpolate(bl_vec.y, -pt_bl.y, sink),
  );

  let tl_val: f32 = dot(tl_vec, pt_tl);
  let tr_val: f32 = dot(tr_vec, pt_tr);
  let br_val: f32 = dot(br_vec, pt_br);
  let bl_val: f32 = dot(bl_vec, pt_bl);

  // Interpolate
  let top_val: f32 = perlin_interpolate(tl_val, tr_val, pt.x - tl.x);
  let bot_val: f32 = perlin_interpolate(bl_val, br_val, pt.x - tl.x);
  let value: f32 = perlin_interpolate(top_val, bot_val, pt.y - tl.y);

  // Clamp value to [-1, 1]
  return max(min(value, 1.0f), -1.0f);
}

fn perlin_gen_f32(world_dims: vec2<u32>, seed: u32, x: u32, y: u32) -> f32 {
  var accum: f32 = 0.0;
  var max_value: f32 = 0.0;
  var amplitude: f32 = 1.0;
  var stage: u32 = 0u;
  var scale: f32 = f32(world_dims[0]) / PERLIN_OCTAVE_MAX_SCALE;
  var cragginess_multiplier = PERLIN_OCTAVE_CRAGGINESS / PERLIN_OCTAVE_STEP;
  for (
    var s: f32 = scale;
    s >= PERLIN_OCTAVE_MIN;
    s = s / PERLIN_OCTAVE_STEP
  ) {
    let val = perlin_stage(world_dims, seed, stage, u32(s), x, y);
    accum = accum + val * amplitude;
    max_value = max_value + amplitude;
    amplitude = amplitude * cragginess_multiplier;
    stage = stage + 1u;
  }
  let res = max(min(accum / max_value, 1.0f), -1.0f);
  return (res + 1.0f) / 2.0f;
}

fn perlin_gen_u16(world_dims: vec2<u32>, seed: u32, x: u32, y: u32) -> u32 {
  let unit_ranged: f32 = perlin_gen_f32(world_dims, seed, x, y);
  return u32(unit_ranged * f32(0xFFFF));
}
// END_LIBRARY(perlin_gen)

// LIBRARY(shady_vm)
/**
 * The shady VM is a small virtual machine that runs inside a shader.
 *
 * The machine uses a register file of 256 32-bit registers, of which the
 * first 240 are general purpose.  The remaining are reserved for special
 * purposes.
 * ```
 * Register file:
 *   r0-r251: 252 x 32-bit registers
 *
 * Special registers:
 *   r253: program counter
 *   r254: vm id
 *   r255: void (target for operations that don't write)
 * ```
 */

/** General config. */
const SHADY_REG_COUNT: u32 = 256u;
const SHADY_REGS_MASK: u32 = 0xFFu;

/**
 * The register file.
 */
struct ShadyRegisterFile {
  regs: array<i32, SHADY_REG_COUNT>,
}

const SHADY_REG_VOID: u32 = 255u;
const SHADY_REG_VMID: u32 = 254u;
const SHADY_REG_PC: u32 = 253u;

const SHADY_MAX_GP_REG: u32 = 251u;

const SHADY_FIRST_OUTPUT_REG: u32 = 56u;
const SHADY_NUM_OUTPUT_REGS: u32 = 64u;

const SHADY_FIRST_INPUT_REG: u32 = 120u;
const SHADY_NUM_INPUT_REGS: u32 = 128u;

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
 *       Operation    VVVP-PPUT SKJI-DCCC
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
 * S = Indirect source 1 operand
 * T = Indirect source 2 operand
 * U = Indirect destination operand
 *   - An indirect source reads from the register named by the low 8 bits of the 
 *     value in the source register.
 *   - An indirect destination writes to the register named by the low 8 bits of
 *     value in the destination register.
 *
 * PPP = Operation kind (3 bits)
 *   - 000 - Add (see "negate" bit for subtract operation)
 *   - 001 - Multiply
 *   - 010 - Divide
 *   - 011 - Modulus
 *   - 100 - Bitwise AND
 *   - 101 - Bitwise OR
 *   - 110 - Bitwise XOR
 *   - 111 - Max
 *
 * VVV = control flow bits (3 bits)
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

/** Offset and mask to extract the indirect-source 1 bit. */
const SHADY_INS_OP_INDSRC1_OFFSET: u32 = 7u;
const SHADY_INS_OP_INDSRC1_MASK: u32 = 0x1u;

/** Offset and mask to extract the indirect-source 2 bit. */
const SHADY_INS_OP_INDSRC2_OFFSET: u32 = 8u;
const SHADY_INS_OP_INDSRC2_MASK: u32 = 0x1u;

/** Offset and mask to extract the indirect-destination bit. */
const SHADY_INS_OP_INDDST_OFFSET: u32 = 9u;
const SHADY_INS_OP_INDDST_MASK: u32 = 0x1u;

/** Offset and mask to extract the operation kind. */
const SHADY_INS_OP_KIND_OFFSET: u32 = 10u;
const SHADY_INS_OP_KIND_MASK: u32 = 0x7u;

/** Offset and mask to extract the control flow bits. */
const SHADY_INS_OP_CFLOW_OFFSET: u32 = 13u;
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
const SHADY_CFLOW_WRITE_BIT: u32 = 1u;
const SHADY_CFLOW_CALL_BIT: u32 = 2u;
const SHADY_CFLOW_RET_BIT: u32 = 4u;


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

/** Extract the indirect-source 1 bit from the instruction.  */
fn shady_ins_op_indsrc1(ins: ShadyInstruction) -> bool {
  return bool((ins.op >> SHADY_INS_OP_INDSRC1_OFFSET) & SHADY_INS_OP_INDSRC1_MASK);
}

/** Extract the indirect-source 2 bit from the instruction.  */
fn shady_ins_op_indsrc2(ins: ShadyInstruction) -> bool {
  return bool((ins.op >> SHADY_INS_OP_INDSRC2_OFFSET) & SHADY_INS_OP_INDSRC2_MASK);
}

/** Extract the indirect-destination bit from the instruction.  */
fn shady_ins_op_inddst(ins: ShadyInstruction) -> bool {
  return bool((ins.op >> SHADY_INS_OP_INDDST_OFFSET) & SHADY_INS_OP_INDDST_MASK);
}

/** Extract the operation kind from the instruction.  */
fn shady_ins_op_kind(ins: ShadyInstruction) -> u32 {
  return (ins.op >> SHADY_INS_OP_KIND_OFFSET) & SHADY_INS_OP_KIND_MASK;
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
  terminated: bool,
}

fn shady_machine_state_new(vm_id: u32, pc: u32) -> ShadyMachineState {
  var state: ShadyMachineState;
  state.vm_id = vm_id;
  state.pc = pc;
  state.flags = 0x7u;
  state.call_depth = 0u;
  state.call_stack = array<u32, 4>(0u, 0u, 0u, 0u);
  state.terminated = false;
  return state;
}

fn shady_machine_state_push_call(state_ptr: ptr<private, ShadyMachineState>) {
  let call_depth = (*state_ptr).call_depth;
  if (call_depth >= 4u) {
    // TODO: Log an error somehow.
    return;
  }
  let return_pc = (*state_ptr).pc + 1u;
  (*state_ptr).call_stack[call_depth] = return_pc;
  (*state_ptr).call_depth = call_depth + 1u;
}

fn shady_machine_state_pop_ret(state_ptr: ptr<private, ShadyMachineState>) -> u32 {
  let call_depth = (*state_ptr).call_depth;
  if (call_depth == 0u) {
    // TODO: Log an error somehow.
    return 0xffffffffu;
  }
  let return_pc = (*state_ptr).call_stack[call_depth - 1u];
  (*state_ptr).call_depth = call_depth - 1u;
  return return_pc;
}
// END_LIBRARY(shady_vm)

struct Uniforms {
  world_dims: vec2<u32>,
  seed: u32,
};

@group(0) @binding(0)
var<uniform> uniforms: Uniforms;

@group(0) @binding(1)
var<storage, write> output_buffer: array<ShadyRegisterFile>;

@compute
@workgroup_size(8, 8)
fn randgen_task(
  @builtin(global_invocation_id) global_id: vec3<u32>
) {
  // We generate 2 values per invocation.
  let x = global_id.x;
  let y = global_id.y;
  // Bounds check.
  if (x >= uniforms.world_dims[0] || y >= uniforms.world_dims[1]) {
    return;
  }
  var value = perlin_gen_u16(uniforms.world_dims, uniforms.seed, x, y);
  let index: u32 = (y * uniforms.world_dims[0]) + x;
  output_buffer[index].regs[0] = i32(value);
}
