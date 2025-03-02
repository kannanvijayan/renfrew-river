use serde;
use crate::cog::CogBufferType;

pub(crate) const CELL_DATA_NUM_WORDS: usize = 8;
pub(crate) type CellDataWords = [u32; CELL_DATA_NUM_WORDS];

/**
 * The coordinate of a single cell.
 * 
 * A cell represents a 1/2 meter cubed volume of space.
 */
#[derive(Clone, Copy, Debug)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct CellData {
  pub(crate) words: CellDataWords,
}
impl CellData {
  pub(crate) const fn new(words: CellDataWords) -> CellData {
    CellData { words }
  }

  pub(crate) fn words(&self) -> &CellDataWords {
    &self.words
  }
}

/**
 * GPU-mapping for cell coordinates.
 */
impl CogBufferType for CellData {
  type GpuType = CellDataWords;
}
impl Into<CellDataWords> for CellData {
  fn into(self) -> CellDataWords {
    self.words
  }
}
impl From<CellDataWords> for CellData {
  fn from(native: CellDataWords) -> Self {
    CellData::new(native)
  }
}
