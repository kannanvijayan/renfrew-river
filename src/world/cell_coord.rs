use std::iter;
use serde;
use crate::gpu::GpuBufferDataType;
use super::WorldDims;

/**
 * The coordinate of a single cell.
 * 
 * A cell represents a 1/2 meter cubed volume of space.
 */
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct CellCoord {
  pub(crate) col: u16,
  pub(crate) row: u16,
}
impl CellCoord {
  const INVALID: CellCoord = CellCoord { col: 0xffff, row: 0xffff };

  pub(crate) const fn new(x: u16, y: u16) -> CellCoord {
    CellCoord { col: x, row: y }
  }
  pub(crate) const fn zero() -> CellCoord {
    CellCoord::new(0, 0)
  }

  pub(crate) const fn add_xy(&self, x: u16, y: u16) -> CellCoord {
    CellCoord::new(self.col + x, self.row + y)
  }

  pub(crate) const fn col_u32(&self) -> u32 { self.col as u32 }
  pub(crate) const fn row_u32(&self) -> u32 { self.row as u32 }

  pub(crate) const fn col_u64(&self) -> u64 { self.col as u64 }
  pub(crate) const fn row_u64(&self) -> u64 { self.row as u64 }

  pub(crate) const fn col_usize(&self) -> usize { self.col as usize }
  pub(crate) const fn row_usize(&self) -> usize { self.row as usize }

  pub(crate) const fn extend(&self, dims: WorldDims) -> CellCoord {
    CellCoord::new(self.col + dims.columns, self.row + dims.rows)
  }

  pub(crate) const fn encode_u32(&self) -> u32 {
    (self.row_u32() << 16) | self.col_u32()
  }
  pub(crate) const fn decode_u32(encoded: u32) -> CellCoord {
    let col = (encoded & 0x0000_ffff) as u16;
    let row = (encoded >> 16) as u16;
    CellCoord { col, row }
  }

  pub(crate) fn is_invalid(&self) -> bool {
    *self == CellCoord::INVALID
  }
}
/**
 * Partial ordering.
 * Less if both col and row are less.
 * Equal if both col and row are equal.
 * Greater if both col and row are greater.
 */
impl PartialOrd for CellCoord {
  fn partial_cmp(&self, other: &CellCoord) -> Option<std::cmp::Ordering> {
    let col_ord = self.col.cmp(&other.col);
    let row_ord = self.row.cmp(&other.row);
    if col_ord == row_ord {
      Some(col_ord)
    } else {
      None
    }
  }
}

/**
 * GPU-mapping for cell coordinates.
 */
impl GpuBufferDataType for CellCoord {
  type NativeType = u32;
  fn to_native(&self) -> Self::NativeType {
    self.encode_u32()
  }
  fn from_native(native: Self::NativeType) -> Self {
    CellCoord::decode_u32(native)
  }
}
