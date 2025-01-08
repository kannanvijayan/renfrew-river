use serde::{ Serialize, Deserialize };
use crate::world::{ UnitId, UnitData };

/**
 * Persistable representation of a list of units.
 */
#[derive(Serialize, Deserialize)]
pub(crate) struct UnitsListPersist {
  data: Vec<UnitPersist>,
}
impl UnitsListPersist {
  pub(crate) fn new(data: Vec<UnitPersist>) -> Self {
    UnitsListPersist { data }
  }
}

/**
 * Persistable representation of a unit.
 */
#[derive(Serialize, Deserialize)]
pub(crate) struct UnitPersist {
  id: UnitId,
  data: UnitData,
}
impl UnitPersist {
  pub(crate) fn new(id: UnitId, data: UnitData) -> Self {
    UnitPersist { id, data }
  }
}
