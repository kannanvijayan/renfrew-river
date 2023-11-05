
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
// END_LIBRARY(game_types)

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
  values: array<PackedCellCoord>,
}

@group(0) @binding(0)
var<uniform> uniforms: Uniforms;

@group(0) @binding(1)
var<storage, read> src_elevations: ElevationMap;

@group(0) @binding(2)
var<storage, read> src_animal_data: AnimalDataList;

@group(0) @binding(3)
var<storage, write> out_animal_positions: TargetPositionList;

fn read_cell_elevation_unchecked(cell: vec2<u32>) -> u32 {
  let cell_idx: u32 = hexcell_index(uniforms.world_dims, cell);
  let elev_x2: ElevationX2 = src_elevations.values[cell_idx >> 1u];
  let elev: u32 = elevation_x2_read_value(elev_x2, cell_idx);
  return elev;
}

fn read_cell_elevation_checked(cell: vec2<u32>) -> u32 {
  if (hexcell_is_invalid(hexcell_checked(uniforms.world_dims, cell))) {
    return u32(-1);
  }
  return read_cell_elevation_unchecked(cell);
}

@compute
@workgroup_size(64)
fn move_animals_downhill(
  @builtin(global_invocation_id) global_id: vec3<u32>
) {
  let animal_id = global_id.x;
  if (animal_id >= uniforms.animal_count) {
    return;
  }

  // Skip animals that don't exist.
  let animal_data = src_animal_data.values[animal_id];
  if (packed_cell_coord_is_invalid(animal_data.position)) {
    return;
  }

  let my_cell = packed_cell_coord_to_cell_coord(animal_data.position);

  // Initialize minimum cell to current cell.
  var min_elev = read_cell_elevation_unchecked(my_cell.col_row);
  var min_cell = my_cell;

  // Check all adjacent cells.
  for (var dir = MIN_HEX_DIR; dir <= MAX_HEX_DIR; dir++) {
    let adj_cell = hexcell_adjacent_checked(
      uniforms.world_dims, my_cell.col_row, dir);
    if (hexcell_is_invalid(adj_cell)) {
      continue;
    }
    let elev = read_cell_elevation_checked(adj_cell);
    if (elev < min_elev) {
      min_elev = elev;
      min_cell = cell_coord_from_vec2(adj_cell);
    }
  }

  out_animal_positions.values[animal_id] =
    packed_cell_coord_from_cell_coord(my_cell);
}
