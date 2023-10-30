use serde;
use crate::world::CellCoord;

/**
 * The dimensions of the game world.
 */
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct WorldDims {
  pub(crate) columns: u16,
  pub(crate) rows: u16,
}
impl WorldDims {
  pub(crate) const fn new(width: u16, height: u16) -> WorldDims {
    WorldDims {
      columns: width,
      rows: height,
    }
  }

  pub(crate) const fn default() -> WorldDims {
    WorldDims {
      columns: 1000,
      rows: 1000,
    }
  }

  pub(crate) const fn area(&self) -> u32 {
    (self.columns as u32) * (self.rows as u32)
  }
  pub(crate) const fn contains_coord(&self, coord: CellCoord) -> bool {
    coord.col < self.columns && coord.row < self.rows
  }
  pub(crate) const fn coord_index(&self, coord: CellCoord) -> u32 {
    (coord.row_u32() * self.columns_u32()) + coord.col_u32()
  }

  pub(crate) fn fits_within(&self, other: WorldDims) -> bool {
    self.columns <= other.columns && self.rows <= other.rows
  }

  pub(crate) const fn columns_u32(&self) -> u32 { self.columns as u32 }
  pub(crate) const fn rows_u32(&self) -> u32 { self.rows as u32 }

  pub(crate) const fn columns_u64(&self) -> u64 { self.columns as u64 }
  pub(crate) const fn rows_u64(&self) -> u64 { self.rows as u64 }

  pub(crate) const fn columns_usize(&self) -> usize { self.columns as usize }
  pub(crate) const fn rows_usize(&self) -> usize { self.rows as usize }

  pub(crate) const fn bottom_right_inclusive(&self, top_left: CellCoord)
    -> CellCoord
  {
    CellCoord::new(
      top_left.col + self.columns - 1,
      top_left.row + self.rows - 1
    )
  }
}