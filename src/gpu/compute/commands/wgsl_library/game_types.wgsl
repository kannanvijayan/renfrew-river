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
const PACKED_cell_COORD_INVALID: u32 = 0xFFFFFFFFu;

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
  return pk_coord.coord_u16x2 == PACKED_cell_COORD_INVALID;
}

// AnimalData
////////////////////////////////////////////////////////////

/** Data associated with an animal. */
struct AnimalData {
  position: PackedCellCoord,
}

/** Get the position from animal data. */
fn animal_data_get_position(animal_data: AnimalData) -> PackedCellCoord {
  return animal_data.position;
}