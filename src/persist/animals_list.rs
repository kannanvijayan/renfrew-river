use serde::{ Serialize, Deserialize };
use crate::world::{ AnimalData, AnimalId };

/**
 * Persistable representation of a list of animals.
 */
#[derive(Serialize, Deserialize)]
pub(crate) struct AnimalsListPersist {
  animals: Vec<AnimalPersist>,
}
impl AnimalsListPersist {
  pub(crate) fn new(animals: Vec<AnimalPersist>) -> Self {
    AnimalsListPersist { animals }
  }
}

/**
 * Persistable representation of an animal.
 */
#[derive(Serialize, Deserialize)]
pub(crate) struct AnimalPersist {
  id: AnimalId,
  data: AnimalData,
}
impl AnimalPersist {
  pub(crate) fn new(id: AnimalId, data: AnimalData) -> Self {
    AnimalPersist { id, data }
  }
}
