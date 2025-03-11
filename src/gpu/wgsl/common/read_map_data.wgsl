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


// FormatSelectorSpecWord
////////////////////////////////////////////////////////////

/**
 * A format selector spec encoded in a single u32.
 */
struct FormatSelectorSpecWord {
  /** The format selector spec. */
  word: u32
}

/** The bits used to encode the format selector spec word. */
const FORMAT_SELECTOR_OUT_INDEX_OFFSET: u32 = 15u;
const FORMAT_SELECTOR_OUT_INDEX_BITS: u32 = 5u;

/** Encodes a format selector spec in a single u32. */
fn format_selector_spec_word_encode(selector: FormatSelectorReadSpec) -> FormatSelectorSpecWord {
  return FormatSelectorSpecWord(
    (selector.selector.word << FORMAT_SELECTOR_WORD_OFFSET) |
    (selector.selector.shift << FORMAT_SELECTOR_SHIFT_OFFSET) |
    (selector.selector.count << FORMAT_SELECTOR_COUNT_OFFSET) |
    (selector.out_index << FORMAT_SELECTOR_OUT_INDEX_OFFSET)
  );
}

/**
 * Decodes a format selector spec from a u32.
 */
fn format_selector_spec_word_decode(fssw: FormatSelectorSpecWord) -> FormatSelectorReadSpec {
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
  top_left: vec2<u32>,
  area: vec2<u32>,
  selectors: vec4<u32>,
  input_entry_size: u32,
  output_entry_size: u32,
};

@group(0) @binding(0)
var<uniform> uniforms: Uniforms;

@group(0) @binding(1)
var<storage, read> input_buffer: array<u32>;

@group(0) @binding(2)
var<storage, write> output_buffer: array<u32>;

@compute
@workgroup_size(8, 8)
fn read_map_data(
  @builtin(global_invocation_id) global_id: vec3<u32>
) {
  let world_dims = uniforms.world_dims;
  let top_left = uniforms.top_left;
  let area = uniforms.area;
  let input_entry_size = uniforms.input_entry_size;
  let output_entry_size = uniforms.output_entry_size;
  let selectors = uniforms.selectors;

  // Bounds check against the output buffer.
  let rel_xy = global_id.xy;
  if (rel_xy.x >= area.x || rel_xy.y >= area.y) {
    return;
  }

  // Bounds check against the world.
  let cell_xy = top_left + rel_xy;
  if (cell_xy.x >= world_dims[0] || cell_xy.y >= world_dims[1]) {
    return;
  }

  let cell_idx = hexcell_index(world_dims, cell_xy);
  let input_offset = cell_idx * input_entry_size;
  for (var i: u32 = 0u; i < 4u; i = i + 1u) {
    let sel_word = FormatSelectorSpecWord(selectors[i]);
    let selector_spec = format_selector_spec_word_decode(sel_word);
    if (selector_spec.out_index >= output_entry_size) {
      continue;
    }
    let selector = selector_spec.selector;
    if (selector.word >= input_entry_size) {
      continue;
    }
    if (format_selector_is_empty(selector)) {
      continue;
    }

    let mask: u32 = format_selector_get_mask(selector);
    let word: u32 = input_buffer[input_offset + selector.word];
    let value: u32 = (word >> selector.shift) & mask;

    let output_idx = hexcell_index(area, rel_xy);
    let output_offset = output_idx * output_entry_size;
    output_buffer[output_offset + selector_spec.out_index] = value;
  }
}
