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

// LIBRARY(format_types)

// FormatSelector
////////////////////////////////////////////////////////////

/**
 * A selector for a format component.
 */
struct FormatSelector {
  /** The index of the word. */
  word: u32,

  /** The index of the component. */
  shift: u32,

  /** The number of bits in the component. */
  count: u32,
}

/** Get the value mask for a format selector. */
fn format_selector_get_mask(sel: FormatSelector) -> u32 {
  return (1u << sel.count) - 1u;
}

/** Check if a format selector is empty. */
fn format_selector_is_empty(sel: FormatSelector) -> bool {
  return sel.count == 0u;
}

// FormatSelectorWord
////////////////////////////////////////////////////////////

/**
 * A format selector encoded in a single u32.
 */
struct FormatSelectorWord {
  /** The format selector. */
  word: u32
}

/** The bits used to encode the format selector word. */
const FORMAT_SELECTOR_WORD_OFFSET: u32 = 0u;
const FORMAT_SELECTOR_WORD_BITS: u32 = 5u;

/** The bits used to encode the format selector offset. */
const FORMAT_SELECTOR_SHIFT_OFFSET: u32 = 5u;
const FORMAT_SELECTOR_SHIFT_BITS: u32 = 5u;

/** The bits used to encode the format selector count. */
const FORMAT_SELECTOR_COUNT_OFFSET: u32 = 10u;
const FORMAT_SELECTOR_COUNT_BITS: u32 = 5u;

/**
 * Encodes a format selector in a single u32.
 */
fn format_selector_word_encode(selector: FormatSelector) -> FormatSelectorWord {
  return FormatSelectorWord(
    (selector.word << FORMAT_SELECTOR_WORD_OFFSET) |
    (selector.shift << FORMAT_SELECTOR_SHIFT_OFFSET) |
    (selector.count << FORMAT_SELECTOR_COUNT_OFFSET)
  );
}

/**
 * Decodes a format selector from a u32.
 */
fn format_selector_word_decode(fsw: FormatSelectorWord) -> FormatSelector {
  let value: u32 = fsw.word;
  return FormatSelector(
    (value >> FORMAT_SELECTOR_WORD_OFFSET) & ((1u << FORMAT_SELECTOR_WORD_BITS) - 1u),
    (value >> FORMAT_SELECTOR_SHIFT_OFFSET) & ((1u << FORMAT_SELECTOR_SHIFT_BITS) - 1u),
    (value >> FORMAT_SELECTOR_COUNT_OFFSET) & ((1u << FORMAT_SELECTOR_COUNT_BITS) - 1u)
  );
}

// FormatSelectorSpec
////////////////////////////////////////////////////////////

struct FormatSelectorReadSpec {
  /** The format selector. */
  selector: FormatSelector,

  /** The index to write into the output buffer. */
  out_index: u32,
}


// FormatSelectorReadSpecWord
////////////////////////////////////////////////////////////

/**
 * A format selector spec encoded in a single u32.
 */
struct FormatSelectorReadSpecWord {
  /** The format selector spec. */
  word: u32
}

/** The bits used to encode the format selector spec word. */
const FORMAT_SELECTOR_OUT_INDEX_OFFSET: u32 = 15u;
const FORMAT_SELECTOR_OUT_INDEX_BITS: u32 = 5u;

/** Encodes a format selector spec in a single u32. */
fn format_selector_spec_word_encode(selector: FormatSelectorReadSpec)
  -> FormatSelectorReadSpecWord
{
  return FormatSelectorReadSpecWord(
    (selector.selector.word << FORMAT_SELECTOR_WORD_OFFSET) |
    (selector.selector.shift << FORMAT_SELECTOR_SHIFT_OFFSET) |
    (selector.selector.count << FORMAT_SELECTOR_COUNT_OFFSET) |
    (selector.out_index << FORMAT_SELECTOR_OUT_INDEX_OFFSET)
  );
}

/**
 * Decodes a format selector spec from a u32.
 */
fn format_selector_spec_word_decode(fssw: FormatSelectorReadSpecWord)
  -> FormatSelectorReadSpec
{
  let value: u32 = fssw.word;
  return FormatSelectorReadSpec(
    FormatSelector(
      (value >> FORMAT_SELECTOR_WORD_OFFSET) & ((1u << FORMAT_SELECTOR_WORD_BITS) - 1u),
      (value >> FORMAT_SELECTOR_SHIFT_OFFSET) & ((1u << FORMAT_SELECTOR_SHIFT_BITS) - 1u),
      (value >> FORMAT_SELECTOR_COUNT_OFFSET) & ((1u << FORMAT_SELECTOR_COUNT_BITS) - 1u)
    ),
    (value >> FORMAT_SELECTOR_OUT_INDEX_OFFSET) &
      ((1u << FORMAT_SELECTOR_OUT_INDEX_BITS) - 1u)
  );
}
// END_LIBRARY(format_types)

// LIBRARY(int64)

// Int64 - 64-bit signed integer type
////////////////////////////////////////////////////////////

struct Int64 {
  value: vec2<u32>,
}

fn int64_min_value() -> Int64 {
  return Int64(vec2<u32>(0u, 1u << 31u));
}
fn int64_max_value() -> Int64 {
  return Int64(vec2<u32>(0xFFFFFFFFu, 0x7FFFFFFFu));
}

fn int64_from_u32(value: u32) -> Int64 {
  return Int64(vec2<u32>(value, 0u));
}

fn int64_from_i32(value: i32) -> Int64 {
  return Int64(vec2<u32>(u32(value), u32(value >> 31u)));
}

fn int64_shl(a: Int64, b: u32) -> Int64 {
  if (b >= 32u) {
    return Int64(vec2<u32>(0u, a.value.x << (b - 32u)));
  } else {
    return Int64(vec2<u32>(a.value.x << b, (a.value.y << b) | (a.value.x >> (32u - b))));
  }
}

fn int64_shr(a: Int64, b: u32) -> Int64 {
  if (b >= 32u) {
    return Int64(vec2<u32>(u32(i32(a.value.y) >> (b - 32u)), u32(i32(a.value.y) >> 31u)));
  } else {
    return Int64(vec2<u32>(
      (a.value.x >> b) | (a.value.y << (32u - b)),
      u32(i32(a.value.y) >> b)
    ));
  }
}

fn int64_complement(a: Int64) -> Int64 {
  return Int64(vec2<u32>(~a.value.x, ~a.value.y));
}

fn int64_negate(a: Int64) -> Int64 {
  let low: u32 = ~a.value.x + 1u;
  var high: u32 = ~a.value.y;
  // Check for overflow / carry.
  if (low == 0u) {
    high += 1u;
  }
  return Int64(vec2<u32>(low, high));
}

fn int64_add(a: Int64, b: Int64) -> Int64 {
  let low: u32 = a.value.x + b.value.x;
  var high: u32 = a.value.y + b.value.y;
  // Check for overflow / carry.
  if (low < a.value.x) {
    high += 1u;
  }
  return Int64(vec2<u32>(low, high));
}

fn int64_sub(a: Int64, b: Int64) -> Int64 {
  let low: u32 = a.value.x - b.value.x;
  var high: u32 = a.value.y - b.value.y;
  // Check for overflow / carry.
  if (low > a.value.x) {
    high -= 1u;
  }
  return Int64(vec2<u32>(low, high));
}

fn int64_mul(a: Int64, b: Int64) -> Int64 {
  let a_low: u32 = a.value.x;
  let a_high: u32 = a.value.y;
  let b_low: u32 = b.value.x;
  let b_high: u32 = b.value.y;

  let a_00 = a_low & 0xFFFFu;
  let a_01 = (a_low >> 16u) & 0xFFFFu;
  let a_10 = a_high & 0xFFFFu;
  let a_11 = u32(i32(a_high) >> 16u);

  let b_00 = b_low & 0xFFFFu;
  let b_01 = (b_low >> 16u) & 0xFFFFu;
  let b_10 = b_high & 0xFFFFu;
  let b_11 = u32(i32(b_high) >> 16u);

  let ab_00_00 = int64_from_u32(a_00 * b_00);
  let ab_00_01 = int64_from_u32(a_00 * b_01);
  let ab_00_10 = int64_from_u32(a_00 * b_10);
  let ab_00_11 = int64_from_u32(a_00 * b_11);

  let ab_01_00 = int64_from_u32(a_01 * b_00);
  let ab_01_01 = int64_from_u32(a_01 * b_01);
  let ab_01_10 = int64_from_u32(a_01 * b_10);

  let ab_10_00 = int64_from_u32(a_10 * b_00);
  let ab_10_01 = int64_from_u32(a_10 * b_01);

  let ab_11_00 = int64_from_u32(a_11 * b_00);

  let sum_00 =
    int64_add(
      ab_00_00,
      int64_add(
        int64_shl(ab_00_01, 16u),
        int64_add(
          int64_shl(ab_00_10, 32u),
          int64_shl(ab_00_11, 48u)
        )
      )
    );
  let sum_01 =
    int64_add(
      int64_shl(ab_01_00, 16u),
      int64_add(
        int64_shl(ab_01_01, 32u),
        int64_shl(ab_01_10, 48u),
      )
    );
  let sum_10 = int64_add(int64_shl(ab_10_00, 32u), int64_shl(ab_10_01, 48u));
  let sum_11 = int64_shl(ab_11_00, 48u);

  return int64_add(int64_add(sum_00, sum_01), int64_add(sum_10, sum_11));
}

fn int64_cmp(a: Int64, b: Int64) -> i32 {
  if (i32(a.value.y) > i32(b.value.y)) {
    return 1;
  } else if (i32(a.value.y) < i32(b.value.y)) {
    return -1;
  } else if (a.value.x > b.value.x) {
    return 1;
  } else if (a.value.x < b.value.x) {
    return -1;
  } else {
    return 0;
  }
}

fn int64_eq(a: Int64, b: Int64) -> bool {
  return (a.value.x == b.value.x) && (a.value.y == b.value.y);
}

fn int64_ne(a: Int64, b: Int64) -> bool {
  return (a.value.x != b.value.x) || (a.value.y != b.value.y);
}

fn int64_le(a: Int64, b: Int64) -> bool {
  return int64_cmp(a, b) <= 0;
}

fn int64_lt(a: Int64, b: Int64) -> bool {
  return int64_cmp(a, b) < 0;
}

fn int64_ge(a: Int64, b: Int64) -> bool {
  return int64_cmp(a, b) >= 0;
}

fn int64_gt(a: Int64, b: Int64) -> bool {
  return int64_cmp(a, b) > 0;
}

fn int64_min(a: Int64, b: Int64) -> Int64 {
  if (int64_lt(a, b)) {
    return a;
  } else {
    return b;
  }
}

fn int64_max(a: Int64, b: Int64) -> Int64 {
  if (int64_gt(a, b)) {
    return a;
  } else {
    return b;
  }
}

fn int64_clamp(a: Int64, min: Int64, max: Int64) -> Int64 {
  if (int64_lt(a, min)) {
    return min;
  } else if (int64_gt(a, max)) {
    return max;
  } else {
    return a;
  }
}


// Vec2Int64 - 64-bit signed integer vector type
////////////////////////////////////////////////////////////

struct Vec2Int64 {
  x: Int64,
  y: Int64,
}

fn vec2int64_new(x: Int64, y: Int64) -> Vec2Int64 {
  return Vec2Int64(x, y);
}

fn vec2int64_from_vec2u32(v: vec2<u32>) -> Vec2Int64 {
  return Vec2Int64(int64_from_u32(v.x), int64_from_u32(v.y));
}

fn vec2int64_from_vec2i32(v: vec2<i32>) -> Vec2Int64 {
  return Vec2Int64(int64_from_i32(v.x), int64_from_i32(v.y));
}

fn vec2int64_shl(a: Vec2Int64, b: u32) -> Vec2Int64 {
  return Vec2Int64(int64_shl(a.x, b), int64_shl(a.y, b));
}

fn vec2int64_shr(a: Vec2Int64, b: u32) -> Vec2Int64 {
  return Vec2Int64(int64_shr(a.x, b), int64_shr(a.y, b));
}

fn vec2int64_complement(a: Vec2Int64) -> Vec2Int64 {
  return Vec2Int64(int64_complement(a.x), int64_complement(a.y));
}

fn vec2int64_negate(a: Vec2Int64) -> Vec2Int64 {
  return Vec2Int64(int64_negate(a.x), int64_negate(a.y));
}

fn vec2int64_add(a: Vec2Int64, b: Vec2Int64) -> Vec2Int64 {
  return Vec2Int64(int64_add(a.x, b.x), int64_add(a.y, b.y));
}

fn vec2int64_sub(a: Vec2Int64, b: Vec2Int64) -> Vec2Int64 {
  return Vec2Int64(int64_sub(a.x, b.x), int64_sub(a.y, b.y));
}

fn vec2int64_mul(a: Vec2Int64, b: Vec2Int64) -> Vec2Int64 {
  return Vec2Int64(int64_mul(a.x, b.x), int64_mul(a.y, b.y));
}
// END_LIBRARY(int64)

const TICK_SCALE: u32 = 0x1000u;
const TICK_SCALE_LOG2: u32 = 12u;

struct Uniforms {
  world_dims: vec2<u32>,
  dist_pct: vec2<u32>,
  entry_size: u32,
  selector: u32,
  min_value: u32,
};

@group(0) @binding(0)
var<uniform> uniforms: Uniforms;

@group(0) @binding(1)
var<storage, read> input_buffer: array<u32>;

@group(0) @binding(2)
var<storage, write> output_buffer: array<u32>;

@compute
@workgroup_size(8, 8)
fn border_fade(
  @builtin(global_invocation_id) global_id: vec3<u32>
) {
  let world_dims = uniforms.world_dims;
  let dist_pct = uniforms.dist_pct;
  let dist_kt = (dist_pct << 10u) / 100u;
  let entry_size = uniforms.entry_size;
  let selector = uniforms.selector;
  let min_value = uniforms.min_value;

  // Bounds check.
  let xy: vec2<u32> = global_id.xy;
  if (xy.x >= world_dims.x || xy.y >= world_dims.y) {
    return;
  }

  let sel_fmt = format_selector_word_decode(
    FormatSelectorReadSpecWord(selector)
  );

  // Read input value.
  let cell_idx: u32 = hexcell_index(world_dims, xy);
  let input_entry_idx: u32 = cell_idx * entry_size;
  let input_word_idx: u32 = input_entry_idx + sel_fmt.word;
  let input_word: u32 = input_buffer[input_word_idx];
  var input_value: u32 = (
    (input_word >> sel_fmt.shift) &
    format_selector_get_mask(sel_fmt)
  );

  if (input_value < min_value) {
    output_buffer[cell_idx] = min_value;
    return;
  }

  // Check distance from border.
  let xy_dist = min(xy, world_dims - xy);
  let xy_dist_kt = (xy_dist << 10u) / world_dims;

  var scale_amount = 1024u;
  if (xy_dist_kt.x < dist_kt.x && xy_dist_kt.y < dist_kt.y) {
    scale_amount = 
      ((xy_dist_kt.x * xy_dist_kt.y) << 10u) / (dist_kt.x * dist_kt.y);
  } else if (xy_dist_kt.x < dist_kt.x) {
    scale_amount = (xy_dist_kt.x << 10u) / dist_kt.x;
  } else if (xy_dist_kt.y < dist_kt.y) {
    scale_amount = (xy_dist_kt.y << 10u) / dist_kt.y;
  }

  output_buffer[cell_idx] = max(
    min_value,
    (((input_value - min_value) * scale_amount) >> 10u) + min_value
  );
}
