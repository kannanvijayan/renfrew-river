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