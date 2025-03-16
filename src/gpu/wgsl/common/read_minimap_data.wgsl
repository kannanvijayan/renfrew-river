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

struct Uniforms {
  world_dims: vec2<u32>,
  mini_dims: vec2<u32>,
  entry_size: u32,
  selector: u32,
};

@group(0) @binding(0)
var<uniform> uniforms: Uniforms;

@group(0) @binding(1)
var<storage, read> input_buffer: array<u32>;

@group(0) @binding(2)
var<storage, write> output_buffer: array<u32>;

@compute
@workgroup_size(8, 8)
fn read_minimap_data(
  @builtin(global_invocation_id) global_id: vec3<u32>
) {
  let world_dims = uniforms.world_dims;
  let mini_dims = uniforms.mini_dims;
  let entry_size = uniforms.entry_size;
  let selector = uniforms.selector;

  let mini_world_scale = vec2<f32>(world_dims) / vec2<f32>(mini_dims);

  // Bounds check against the output buffer.
  let mini_xy: vec2<u32> = global_id.xy;
  if (mini_xy.x >= mini_dims.x || mini_xy.y >= mini_dims.y) {
    return;
  }

  // Calculate the world cell coordinate boundaries that
  // correspond to the minimap cell.
  let cell_xy_cf = (
    vec2<f32>(world_dims) *
    (vec2<f32>(mini_xy) / vec2<f32>(mini_dims))
  );
  let cell_xy_br_f = cell_xy_cf + (vec2<f32>(0.5, 0.5) * mini_world_scale);
  let cell_xy_tl_f = cell_xy_cf - (vec2<f32>(0.5, 0.5) * mini_world_scale);

  let cell_xy_tl_signed = vec2<i32>(floor(cell_xy_tl_f));
  let cell_xy_br_unclamped = vec2<u32>(ceil(cell_xy_br_f));

  // Clamp the top left corner to (0, 0)
  // Clamp the bottom right corner to (world_dims.x, world_dims.y)
  let cell_xy_tl = vec2<u32>(max(cell_xy_tl_signed, vec2<i32>(0, 0)));
  let cell_xy_br = min(cell_xy_br_unclamped, world_dims - vec2<u32>(1u, 1u));

  let cells_span = vec2<u32>(cell_xy_br - cell_xy_tl);

  let sel_word = FormatSelectorWord(selector);
  let sel = format_selector_word_decode(sel_word);

  var sum = 0u;
  var count = 0u;

  for (var j = 0u; j < cells_span.y; j++) {
    for (var i = 0u; i < cells_span.x; i++) {
      let cell = hexcell_checked(world_dims, cell_xy_tl + vec2<u32>(i, j));
      if (hexcell_is_invalid(cell)) {
        continue;
      }
      let cell_index = hexcell_index(world_dims, cell);

      let entry_index = cell_index * entry_size;
      let word_index = entry_index + sel.word;
      let word_value = input_buffer[word_index];
      let shifted_value = word_value >> sel.shift;
      let value = shifted_value & format_selector_get_mask(sel);

      sum += value;
      count += 1u;
    }
  }

  var avg = 0xFFFFFFFFu;
  if (count > 0u) {
    avg = u32(f32(sum) / f32(count));
  }
  let mini_index = hexcell_index(mini_dims, mini_xy);
  output_buffer[mini_index] = avg;

/*
  let output_buffer_size = mini_dims.x * mini_dims.y;
  if ((mini_xy.x < 10u) && (mini_xy.y < 10u)) {
    var i = 0u;

    output_buffer[mini_index * 16u  + i] = mini_xy.x;
    i += 1u;

    output_buffer[mini_index * 16u  + i] = mini_xy.y;
    i += 1u;

    output_buffer[mini_index * 16u  + i] = cell_xy_tl.x;
    i += 1u;

    output_buffer[mini_index * 16u  + i] = cell_xy_tl.y;
    i += 1u;

    output_buffer[mini_index * 16u  + i] = cells_span.x;
    i += 1u;

    output_buffer[mini_index * 16u  + i] = cells_span.y;
    i += 1u;

    output_buffer[mini_index * 16u  + i] = 7777777u;
    i += 1u;

    output_buffer[mini_index * 16u  + i] = count;
    i += 1u;

    output_buffer[mini_index * 16u  + i] = avg;
    i += 1u;

    output_buffer[mini_index * 16u  + i] = sum;
    i += 1u;

    output_buffer[mini_index * 16u  + i] = 8888888u;
    i += 1u;

    output_buffer[mini_index * 16u  + i] = hexcell_index(world_dims, cell_xy_tl);
    i += 1u;

    output_buffer[mini_index * 16u  + i] = mini_index;
    i += 1u;

    output_buffer[mini_index * 16u  + i] = u32(mini_world_scale.x * 1000.0);
    i += 1u;

    output_buffer[mini_index * 16u  + i] = u32(mini_world_scale.y * 1000.0);
    i += 1u;

    output_buffer[mini_index * 16u  + i] = 9999999u;
    i += 1u;
  }
*/
}
