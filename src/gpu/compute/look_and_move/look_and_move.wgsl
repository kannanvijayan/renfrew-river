

// LIBRARY("xxhash")
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
// END_LIBRARY("xxhash")

// LIBRARY("hex_geometry")
// Hexagon directions
const HEX_DIR_N: u32 = 0u;
const HEX_DIR_NE: u32 = 1u;
const HEX_DIR_SE: u32 = 2u;
const HEX_DIR_S: u32 = 3u;
const HEX_DIR_SW: u32 = 4u;
const HEX_DIR_NW: u32 = 5u;

const HEX_INVALID_TILE: vec2<u32> = vec2<u32>(0xFFFFFFFFu, 0xFFFFFFFFu);

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
fn hex_tile_is_invalid(tile: vec2<u32>) -> bool {
  return tile.x == HEX_INVALID_TILE.x && tile.y == HEX_INVALID_TILE.y;
}

// The index of a hex tile, given a set of dimensions
fn hex_tile_index(
  dims: vec2<u32>,
  tile: vec2<u32>
) -> u32 {
  return tile.y * dims.x + tile.x;
}

// Check if a tile is within bounds
fn hex_tile_checked(
  dims: vec2<u32>,
  tile: vec2<u32>
) -> vec2<u32> {
  if (tile.x >= dims.x || tile.y >= dims.y) {
    return HEX_INVALID_TILE;
  } else {
    return tile;
  }
}
 
// Calculate tile in given direction
fn hex_adjacent_tile_unchecked(
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
fn hex_adjacent_tile_n_unchecked(
  tile: vec2<u32>,
  dir: u32,
  n: u32
) -> vec2<u32> {
  var out_tile = tile;
  for (var i = 0u; i < n; i++) {
    out_tile = hex_adjacent_tile_unchecked(tile, dir);
  }
  return out_tile;
}

// Calculate tile in given direction
fn hex_adjacent_tile_checked(
  dims: vec2<u32>,
  tile: vec2<u32>,
  dir: u32
) -> vec2<u32> {
  var adj = hex_adjacent_tile_unchecked(tile, dir);
  if (adj.x >= dims.x || adj.y >= dims.y) {
    adj = HEX_INVALID_TILE;
  }
  return adj;
}
// END_LIBRARY("hex_geometry")

// LIBRARY("game_types")
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
const ELEVATION_BITS: u32 = 10u;

/** Bit mask for extracting elevation values. */
const ELEVATION_MASK: u32 = 0x3FFu;

/** Read one of the elevation values from an ElevationX2.
 * The low bit of idx selects the value.
 */
fn elevation_x2_read_value(elevation: ElevationX2, idx: u32) -> u32 {
  return (elevation.elevation_u16x2 >> ((idx & 1u) * 16u)) & ELEVATION_MASK;
}

// WorldDims
////////////////////////////////////////////////////////////

/** 2D Dimensions of world tiles. */
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

// TileCoord
////////////////////////////////////////////////////////////

/** 2D Coordinates of a tile. */
struct TileCoord {
  col_row: vec2<u32>
}

/** Create a tile coordinate from a vec2 of a column and row. */
fn tile_coord_from_vec2(col_row: vec2<u32>) -> TileCoord {
  return TileCoord(col_row);
}

/** Get column. */
fn tile_coord_get_column(tile_coord: TileCoord) -> u32 {
  return tile_coord.col_row.x;
}

/** Get row. */
fn tile_coord_get_row(tile_coord: TileCoord) -> u32 {
  return tile_coord.col_row.y;
}

// PackedTileCoord
////////////////////////////////////////////////////////////

/** Packed 2D coordinates of a tile. */
struct PackedTileCoord {
  coord_u16x2: u32,
}
/** Invalid packed tile coordinate value. */
const PACKED_TILE_COORD_INVALID: u32 = 0xFFFFFFFFu;

/** Create a packed tile coordinate from a tile coordinate. */
fn packed_tile_coord_from_tile_coord(position: vec2<u32>) -> PackedTileCoord {
  return PackedTileCoord((position.y << 16u) | position.x);
}

/** Extract the x component of a packed tile coordinate. */
fn packed_tile_coord_get_x(position: PackedTileCoord) -> u32 {
  return position.coord_u16x2 & 0xFFFFu;
}

/** Extract the y component of a packed tile coordinate. */
fn packed_tile_coord_get_y(position: PackedTileCoord) -> u32 {
  return position.coord_u16x2 >> 16u;
}

/** Unpack a packed tile coordinate into a tile coordinate. */
fn packed_tile_coord_to_tile_coord(position: PackedTileCoord) -> TileCoord {
  let x = packed_tile_coord_get_x(position);
  let y = packed_tile_coord_get_y(position);
  return TileCoord(vec2<u32>(x, y));
}

/** Check if a packed tile coordinate is invalid. */
fn packed_tile_coord_is_invalid(position: PackedTileCoord) -> bool {
  return position.coord_u16x2 == PACKED_TILE_COORD_INVALID;
}

// AnimalData
////////////////////////////////////////////////////////////

/** Data associated with an animal. */
struct AnimalData {
  position: PackedTileCoord,
}

/** Get the position from animal data. */
fn animal_data_get_position(animal_data: AnimalData) -> PackedTileCoord {
  return animal_data.position;
}
// END_LIBRARY("game_types")

struct Uniforms {
  world_dims: vec2<u32>,
  animal_count: u32,
};

struct ElevationMap {
  values: array<ElevationX2>,
};
struct AnimalDataList {
  values: array<AnimalData>,
};
struct TargetPositionList {
  values: array<PackedTileCoord>,
}

@group(0) @binding(0)
var<uniform> uniforms: Uniforms;

@group(0) @binding(1)
var<storage, read> src_elevations: ElevationMap;

@group(0) @binding(2)
var<storage, read> src_animal_data: AnimalDataList;

@group(0) @binding(3)
var<storage, write> out_animal_positions: TargetPositionList;

fn maybe_read_tile_elevation(tile: vec2<u32>) -> vec2<u32> {
  if (hex_tile_is_invalid(hex_tile_checked(uniforms.world_dims, tile))) {
    return vec2<u32>(0u, 0u);
  }
  let tile_idx: u32 = hex_tile_index(uniforms.world_dims, tile);
  let elev_x2: ElevationX2 = src_elevations.values[tile_idx >> 1u];
  let elev: u32 = elevation_x2_read_value(elev_x2, tile_idx);
  return vec2<u32>(elev, 1u);
}

@compute
@workgroup_size(64)
fn look_and_move(
  @builtin(global_invocation_id) global_id: vec3<u32>
) {
  let animal_id = global_id.x;
  if (animal_id >= uniforms.animal_count) {
    return;
  }

  // Skip animals that don't exist.
  let animal_data = src_animal_data.values[animal_id];
  if (packed_tile_coord_is_invalid(animal_data.position)) {
    return;
  }

  var sum_elevs = vec2<u32>(0u, 0u);
  for (var dist: u32 = 1u; dist <= 2u; dist = dist + 1u) {
    let start_posn = hex_adjacent_tile_n_unchecked(
      packed_tile_coord_to_tile_coord(animal_data.position).col_row,
      HEX_DIR_N,
      dist
    );
    var cur_posn = start_posn;
    // Travel south-east dist times.
    for (var i = 0u; i < dist; i = i + 1u) {
      sum_elevs += maybe_read_tile_elevation(cur_posn);
      cur_posn = hex_adjacent_tile_unchecked(cur_posn, HEX_DIR_SE);
    }
    // Travel south dist times.
    for (var i = 0u; i < dist; i = i + 1u) {
      sum_elevs += maybe_read_tile_elevation(cur_posn);
      cur_posn = hex_adjacent_tile_unchecked(cur_posn, HEX_DIR_S);
    }
    // Travel south-west dist times.
    for (var i = 0u; i < dist; i = i + 1u) {
      sum_elevs += maybe_read_tile_elevation(cur_posn);
      cur_posn = hex_adjacent_tile_unchecked(cur_posn, HEX_DIR_SW);
    }
    // Travel north-west dist times.
    for (var i = 0u; i < dist; i = i + 1u) {
      sum_elevs += maybe_read_tile_elevation(cur_posn);
      cur_posn = hex_adjacent_tile_unchecked(cur_posn, HEX_DIR_NW);
    }
    // Travel north dist times.
    for (var i = 0u; i < dist; i = i + 1u) {
      sum_elevs += maybe_read_tile_elevation(cur_posn);
      cur_posn = hex_adjacent_tile_unchecked(cur_posn, HEX_DIR_N);
    }
    // Travel north-east dist times.
    for (var i = 0u; i < dist; i = i + 1u) {
      sum_elevs += maybe_read_tile_elevation(cur_posn);
      cur_posn = hex_adjacent_tile_unchecked(cur_posn, HEX_DIR_NE);
    }
  }

  let target_posn_vec2 = vec2<u32>(
    u32(sum_elevs.x / sum_elevs.y) & 0xFFFFu,
    sum_elevs.y
  );
  let target_posn = tile_coord_from_vec2(target_posn_vec2);
  out_animal_positions.values[animal_id] =
    packed_tile_coord_from_tile_coord(target_posn_vec2);
}