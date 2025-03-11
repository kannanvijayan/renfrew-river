
// WorldDims
////////////////////////////////////////////////////////////

/** 2D Dimensions of world cells. */
struct WorldDims {
  columns: u32,
  rows: u32,
}

// CellCoord
////////////////////////////////////////////////////////////

/** 2D Coordinates of a cell. */
struct CellCoord {
  col: u32,
  row: u32,
}

/** Create a cell coordinate from a vec2 of a column and row. */
fn cell_coord_from_vec2(col_row: vec2<u32>) -> CellCoord {
  return CellCoord(col_row.x, col_row.y);
}

/** Get colum and row as a vec2. */
fn cell_coord_to_vec2(cell_coord: CellCoord) -> vec2<u32> {
  return vec2<u32>(cell_coord.col, cell_coord.row);
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
  return PackedCellCoord((coord.row << 16u) | coord.col);
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
  return CellCoord(x, y);
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

// CellData
////////////////////////////////////////////////////////////

const CELL_DATA_NUM_WORDS: u32 = 8u;

struct CellDataWord {
  word: u32
}

/** Get a word from a cell data. */
fn cell_data_word_offset(index: u32) -> u32 {
  return index * CELL_DATA_NUM_WORDS;
}

/** Get a specific word from a cell data. */
fn cell_data_word_offset_of_word(index: u32, word: u32) -> u32 {
  return cell_data_word_offset(index) + word;
}
