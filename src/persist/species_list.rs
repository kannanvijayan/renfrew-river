use serde::{ Serialize, Deserialize };
use crate::world::SpeciesInfo;


/**
 * Persistable representation of a list of species.
 */
#[derive(Serialize, Deserialize)]
pub(crate) struct SpeciesListPersist {
  species: Vec<SpeciesInfo>,
}
impl SpeciesListPersist {
  pub(crate) fn new(species: Vec<SpeciesInfo>) -> Self {
    SpeciesListPersist { species }
  }
}
