use serde::{ Serialize, Deserialize };
use crate::world::Elevation;

/**
 * Persistable representation of an elevation map.
 */
#[derive(Serialize, Deserialize)]
pub(crate) struct ElevationMapPersist {
  data: Vec<Vec<Elevation>>,
}
impl ElevationMapPersist {
  pub(crate) fn new(data: Vec<Vec<Elevation>>) -> Self {
    ElevationMapPersist { data }
  }
}
