use serde;
use crate::world::{ Elevation, AnimalId };

/**
 * Core information pertaining to a cell.
 */
#[derive(Copy, Clone, Debug)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct CellInfo {
  pub(crate) elevation: Elevation,
  pub(crate) animal_id: Option<AnimalId>,
}
