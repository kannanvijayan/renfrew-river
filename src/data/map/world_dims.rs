use serde;
use crate::data::map::CellCoord;

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

  pub(crate) fn to_input(&self) -> WorldDimsInput {
    WorldDimsInput {
      columns: self.columns.to_string(),
      rows: self.rows.to_string(),
    }
  }

  pub(crate) const fn area(&self) -> u32 {
    (self.columns as u32) * (self.rows as u32)
  }
  pub(crate) const fn contains_coord(&self, coord: CellCoord) -> bool {
    coord.col < self.columns && coord.row < self.rows
  }
  pub(crate) const fn contains_or_bounded_by_coord(&self, coord: CellCoord) -> bool {
    coord.col <= self.columns && coord.row <= self.rows
  }
  pub(crate) const fn coord_index(&self, coord: CellCoord) -> u32 {
    (coord.row_u32() * self.columns_u32()) + coord.col_u32()
  }
  pub(crate) const fn index_coord(&self, index: usize) -> CellCoord {
    CellCoord::new(
      (index as u32 % self.columns_u32()) as u16,
      (index as u32 / self.columns_u32()) as u16
    )
  }

  pub(crate) fn fits_within(&self, other: WorldDims) -> bool {
    self.columns <= other.columns && self.rows <= other.rows
  }

  pub(crate) const fn columns_u16(&self) -> u16 { self.columns as u16 }
  pub(crate) const fn rows_u16(&self) -> u16 { self.rows as u16 }

  pub(crate) const fn columns_u32(&self) -> u32 { self.columns as u32 }
  pub(crate) const fn rows_u32(&self) -> u32 { self.rows as u32 }

  pub(crate) const fn columns_u64(&self) -> u64 { self.columns as u64 }
  pub(crate) const fn rows_u64(&self) -> u64 { self.rows as u64 }

  pub(crate) const fn columns_usize(&self) -> usize { self.columns as usize }
  pub(crate) const fn rows_usize(&self) -> usize { self.rows as usize }

  pub(crate) const fn div_ceil_dims(&self, other_dims: WorldDims) -> WorldDims {
    WorldDims::new(
      self.columns.div_ceil(other_dims.columns),
      self.rows.div_ceil(other_dims.rows)
    )
  }

  pub(crate) const fn bottom_right_inclusive(&self, top_left: CellCoord)
    -> CellCoord
  {
    CellCoord::new(
      top_left.col + self.columns - 1,
      top_left.row + self.rows - 1
    )
  }

  pub(crate) const fn div_ceil_u32(&self, scale: u32) -> WorldDims {
    let cols = self.columns_u32().div_ceil(scale);
    let rows = self.rows_u32().div_ceil(scale);
    WorldDims::new(cols as u16, rows as u16)
  }

  pub(crate) fn each_index_by_row<P>(&self, p: P)
    where P: FnMut(u32, CellCoord)
  {
    let mut proc = p;
    for row in 0..self.rows {
      for col in 0..self.columns {
        let index = self.coord_index(CellCoord::new(col, row));
        proc(index, CellCoord::new(col, row));
      }
    }
  }
}

#[derive(Clone, Debug)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct WorldDimsInput {
  pub(crate) columns: String,
  pub(crate) rows: String,
}
impl WorldDimsInput {
  pub(crate) fn to_world_dims(&self, min: WorldDims, max: WorldDims)
    -> Result<WorldDims, WorldDimsValidation>
  {
    let mut errors = Vec::new();
    let mut column_errors = Vec::new();
    let mut row_errors = Vec::new();

    let columns = if self.columns.len() > 0 {
      match self.columns.parse::<u16>() {
        Ok(value) => {
          if value < min.columns {
            column_errors.push(format!("Columns must be at least {}.", min.columns));
            column_errors.push(self.columns.clone());
          } else if value > max.columns {
            column_errors.push(format!("Columns must be at most {}.", max.columns));
            column_errors.push(self.columns.clone());
          }
          value
        },
        Err(_) => {
          column_errors.push("Columns must be a number.".to_string());
          column_errors.push(self.columns.clone());
          0
        }
      }
    } else {
      errors.push("Columns is empty.".to_string());
      0
    };

    let rows = if self.rows.len() > 0 {
      match self.rows.parse::<u16>() {
        Ok(value) => {
          if value < min.rows {
            row_errors.push(format!("Rows must be at least {}.", min.rows));
            row_errors.push(self.rows.clone());
          } else if value > max.rows {
            row_errors.push(format!("Rows must be at most {}.", max.rows));
            row_errors.push(self.rows.clone());
          }
          value
        }
        Err(_) => {
          row_errors.push("Rows must be a number.".to_string());
          row_errors.push(self.rows.clone());
          0
        }
      }
    } else {
      errors.push("Rows is empty.".to_string());
      0
    };

    if errors.is_empty() && column_errors.is_empty() && row_errors.is_empty() {
      Ok(WorldDims::new(columns, rows))
    } else {
      Err(WorldDimsValidation { errors, columns: column_errors, rows: row_errors })
    }
  }
}

#[derive(Clone, Debug)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct WorldDimsValidation {
  pub(crate) errors: Vec<String>,
  pub(crate) columns: Vec<String>,
  pub(crate) rows: Vec<String>,
}
impl WorldDimsValidation {
  pub(crate) fn new_valid() -> Self {
    WorldDimsValidation {
      errors: Vec::new(),
      columns: Vec::new(),
      rows: Vec::new(),
    }
  }

  pub(crate) fn is_valid(&self) -> bool {
    self.errors.is_empty() && self.columns.is_empty() && self.rows.is_empty()
  }
}
