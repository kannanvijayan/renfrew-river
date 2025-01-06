// LIBRARY(hex_geometry)
// Hexagon directions
const HEX_DIR_N: u32 = 0u;
const HEX_DIR_NE: u32 = 1u;
const HEX_DIR_SE: u32 = 2u;
const HEX_DIR_S: u32 = 3u;
const HEX_DIR_SW: u32 = 4u;
const HEX_DIR_NW: u32 = 5u;

const MIN_HEX_DIR: u32 = 0u;
const MAX_HEX_DIR: u32 = 5u;

const HEXCELL_INVALID: vec2<u32> = vec2<u32>(0xFFFFFFFFu, 0xFFFFFFFFu);

/*
 *          0   1   2   3   4   5   6
 *         ___     ___     ___     ___
 *   0    /   \___/   \___/   \___/   \
 *        \___/   \___/ 2 \___/   \___/
 *   1    /   \___/ 2 \___/ 2 \___/   \
 *        \___/ 2 \___/ 1 \___/ 2 \___/
 *   2    /   \___/ 1 \___/ 1 \___/   \
 *        \___/ 2 \___/ * \___/ 2 \___/
 *   3    /   \___/ 1 \___/ 1 \___/   \
 *        \___/ 2 \___/ 1 \___/ 2 \___/
 *   4    /   \___/ 2 \___/ 2 \___/   \
 *        \___/   \___/ 2 \___/   \___/
 *   5    /   \___/   \___/   \___/   \
 *        \___/   \___/   \___/   \___/
 *
 */

// Check if a tile is valid.
fn hexcell_is_invalid(tile: vec2<u32>) -> bool {
  return tile.x == HEXCELL_INVALID.x && tile.y == HEXCELL_INVALID.y;
}

// The index of a hex tile, given a set of dimensions
fn hexcell_index(
  dims: vec2<u32>,
  tile: vec2<u32>
) -> u32 {
  return tile.y * dims.x + tile.x;
}

// Check if a tile is within bounds
fn hexcell_checked(
  dims: vec2<u32>,
  tile: vec2<u32>
) -> vec2<u32> {
  if (tile.x >= dims.x || tile.y >= dims.y) {
    return HEXCELL_INVALID;
  } else {
    return tile;
  }
}

// Calculate tile in given direction
fn hexcell_adjacent_unchecked(
  tile: vec2<u32>,
  dir: u32
) -> vec2<u32> {
  let col: u32 = tile.x;
  let row: u32 = tile.y;
  let col_odd: u32 = col & 1u;
  let col_even: u32 = 1u - col_odd;
  var d: u32 = dir % 6u;
  switch d {
    case 0u: { return vec2<u32>(col, row - 1u); }
    case 1u: { return vec2<u32>(col + 1u, row - col_even); }
    case 2u: { return vec2<u32>(col + 1u, row + col_odd); }
    case 3u: { return vec2<u32>(col, row + 1u); }
    case 4u: { return vec2<u32>(col - 1u, row + col_odd); }
    default: { return vec2<u32>(col - 1u, row - col_even); }
  }
}

// Calculate tile N units out in a given direction.
fn hexcell_adjacent_n_unchecked(
  tile: vec2<u32>,
  dir: u32,
  n: u32
) -> vec2<u32> {
  var out_tile = tile;
  for (var i = 0u; i < n; i++) {
    out_tile = hexcell_adjacent_unchecked(tile, dir);
  }
  return out_tile;
}

// Calculate tile in given direction
fn hexcell_adjacent_checked(
  dims: vec2<u32>,
  tile: vec2<u32>,
  dir: u32
) -> vec2<u32> {
  var adj = hexcell_adjacent_unchecked(tile, dir);
  if (adj.x >= dims.x || adj.y >= dims.y) {
    adj = HEXCELL_INVALID;
  }
  return adj;
}
// END_LIBRARY(hex_geometry)

// LIBRARY(game_types)
// ElevationX2
////////////////////////////////////////////////////////////

/**
 * ElevationX2 represents two 16-bit elevation values packed into
 * a single 32-bit word.
 */
struct ElevationX2 {
  elevation_u16x2: u32,
}
/** The number of significant bits in each elevation value. */
const ELEVATION_BITS: u32 = 12u;

/** Bit mask for extracting elevation values. */
const ELEVATION_MASK: u32 = 0xFFFu;

/** Read one of the elevation values from an ElevationX2.
 * The low bit of idx selects the value.
 */
fn elevation_x2_read_value(elevation: ElevationX2, idx: u32) -> u32 {
  return (elevation.elevation_u16x2 >> ((idx & 1u) << 4u)) & ELEVATION_MASK;
}

// WorldDims
////////////////////////////////////////////////////////////

/** 2D Dimensions of world cells. */
struct WorldDims {
  columns_rows: vec2<u32>
}

/** Get number of columns. */
fn world_dims_get_columns(world_dims: WorldDims) -> u32 {
  return world_dims.columns_rows.x;
}

/** Get number of rows. */
fn world_dims_get_rows(world_dims: WorldDims) -> u32 {
  return world_dims.columns_rows.y;
}

// CellCoord
////////////////////////////////////////////////////////////

/** 2D Coordinates of a cell. */
struct CellCoord {
  col_row: vec2<u32>
}

/** Create a cell coordinate from a vec2 of a column and row. */
fn cell_coord_from_vec2(col_row: vec2<u32>) -> CellCoord {
  return CellCoord(col_row);
}

/** Get column. */
fn cell_coord_get_column(cell_coord: CellCoord) -> u32 {
  return cell_coord.col_row.x;
}

/** Get row. */
fn cell_coord_get_row(cell_coord: CellCoord) -> u32 {
  return cell_coord.col_row.y;
}

// PackedCellCoord
////////////////////////////////////////////////////////////

/** Packed 2D coordinates of a cell. */
struct PackedCellCoord {
  coord_u16x2: u32,
}
/** Invalid packed cell coordinate value. */
const PACKED_CELL_COORD_INVALID: u32 = 0xFFFFFFFFu;

/** Create a packed cell coordinate from a cell coordinate. */
fn packed_cell_coord_from_cell_coord(coord: CellCoord) -> PackedCellCoord {
  return PackedCellCoord((coord.col_row.y << 16u) | coord.col_row.x);
}

/** Extract the x component of a packed cell coordinate. */
fn packed_cell_coord_get_x(pk_coord: PackedCellCoord) -> u32 {
  return pk_coord.coord_u16x2 & 0xFFFFu;
}

/** Extract the y component of a packed cell coordinate. */
fn packed_cell_coord_get_y(pk_coord: PackedCellCoord) -> u32 {
  return pk_coord.coord_u16x2 >> 16u;
}

/** Unpack a packed cell coordinate into a cell coordinate. */
fn packed_cell_coord_to_cell_coord(pk_coord: PackedCellCoord) -> CellCoord {
  let x = packed_cell_coord_get_x(pk_coord);
  let y = packed_cell_coord_get_y(pk_coord);
  return CellCoord(vec2<u32>(x, y));
}

/** Check if a packed cell coordinate is invalid. */
fn packed_cell_coord_is_invalid(pk_coord: PackedCellCoord) -> bool {
  return pk_coord.coord_u16x2 == PACKED_CELL_COORD_INVALID;
}

/** Check if two packed cell coordinates are equal. */
fn packed_cell_coord_equal(pk_coord1: PackedCellCoord, pk_coord2: PackedCellCoord) -> bool {
  return pk_coord1.coord_u16x2 == pk_coord2.coord_u16x2;
}

/** Create an invalid packed cell coordinate. */
fn packed_cell_coord_new_invalid() -> PackedCellCoord {
  return PackedCellCoord(PACKED_CELL_COORD_INVALID);
}

// AnimalData
////////////////////////////////////////////////////////////

/** Data associated with an animal. */
struct AnimalData {
  position: PackedCellCoord,
}

/** Animal ids. */
struct AnimalId {
  value: u32,
}

const INVALID_ANIMAL_ID_VALUE = 0xFFFFFFFFu;

/** Get the position from animal data. */
fn animal_data_get_position(animal_data: AnimalData) -> PackedCellCoord {
  return animal_data.position;
}

/** Check if an animal id is valid. */
fn animal_id_is_valid(animal_id: AnimalId) -> bool {
  return animal_id.value != INVALID_ANIMAL_ID_VALUE;
}

/** Check if two animal ids are equal. */
fn animal_id_equal(animal_id1: AnimalId, animal_id2: AnimalId) -> bool {
  return animal_id1.value == animal_id2.value;
}

/** Create an invalid animal id. */
fn animal_id_new_invalid() -> AnimalId {
  return AnimalId(INVALID_ANIMAL_ID_VALUE);
}

/** Create an animal id from a value. */
fn animal_id_from_u32(value: u32) -> AnimalId {
  return AnimalId(value);
}

/** Get the animal id value. */
fn animal_id_get_value(animal_id: AnimalId) -> u32 {
  return animal_id.value;
}
// END_LIBRARY(game_types)

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
const SHADY_REGS_MASK: u32 = 0xFFu;

/**
 * The register file.
 */
struct ShadyRegisterFile {
  regs: array<i32, SHADY_REG_COUNT>,
}

const SHADY_REG_VMID: u32 = 240u;
const SHADY_REG_PC: u32 = 241u;

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
  vm_count: u32,
};

@group(0) @binding(0)
var<uniform> uniforms: Uniforms;

@group(0) @binding(1)
var<storage, read> animals_list: array<AnimalData>;

@group(0) @binding(2)
var<storage, read> start_pcs: array<u32>;

@group(0) @binding(3)
var<storage, read> register_files: array<ShadyRegisterFile>;

@group(0) @binding(4)
var<storage, write> out_cell_coords: array<PackedCellCoord>;

@compute
@workgroup_size(64)
fn fill_registers(
  @builtin(global_invocation_id) global_id: vec3<u32>
) {
  let vm_id = global_id.x;
  if (vm_id >= uniforms.vm_count) {
    return;
  }

  // Skip vms that have an invalid start pc.
  let start_pc = start_pcs[vm_id];
  if (start_pc == 0xFFFFFFFFu) {
    out_cell_coords[vm_id] = packed_cell_coord_new_invalid();
    return;
  }

  let r0 = register_files[vm_id].regs[0u];
  var position = packed_cell_coord_to_cell_coord(animals_list[vm_id].position);
  if (r0 >= 0) {
    position = cell_coord_from_vec2(
      hexcell_adjacent_checked(
        uniforms.world_dims,
        position.col_row,
        u32(r0) % 6u
      )
    );
  }

  out_cell_coords[vm_id] = packed_cell_coord_from_cell_coord(position);
}
