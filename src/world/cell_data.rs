use serde;
use crate::{cog::CogBufferType, ruleset::{FormatComponentSelector, FormatRules}};

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
  pub(crate) const NUM_WORDS: u32 = CELL_DATA_NUM_WORDS as u32;

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

/**
 * A selector for a cell component.
 */
#[derive(Clone, Debug)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct CellComponentSelector {
  pub(crate) word: String,
  pub(crate) component: String,
}
impl CellComponentSelector {
  pub(crate) fn format_selector(&self, format_rules: &FormatRules)
    -> Option<FormatComponentSelector>
  {
    format_rules.selector_for(&self.word, &self.component)
  }
}
