use serde::{ Serialize, Deserialize };
use crate::{
  game::ExtraFlags,
  world::{ TurnNo, WorldDims }
};
use super::{
  ElevationMapPersist,
  AnimalsListPersist,
  SpeciesListPersist,
  ProgramStorePersist,
};

/**
 * Persistable representation of a game.
 */
#[derive(Debug, Clone)]
#[derive(Serialize, Deserialize)]
pub(crate) struct WorldPersist {
  world_dims: WorldDims,
  turn_no: TurnNo,
  rand_seed: u64,
  extra_flags: ExtraFlags,

  elevation_map: ElevationMapPersist,
  animals_list: AnimalsListPersist,
  species_list: SpeciesListPersist,
  program_store: ProgramStorePersist,
}
impl WorldPersist {
  pub(crate) fn new(
    world_dims: WorldDims,
    turn_no: TurnNo,
    rand_seed: u64,
    extra_flags: ExtraFlags,
    elevation_map: ElevationMapPersist,
    animals_list: AnimalsListPersist,
    species_list: SpeciesListPersist,
    program_store: ProgramStorePersist,
  ) -> WorldPersist {
    WorldPersist {
      world_dims,
      turn_no,
      rand_seed,
      extra_flags,
      elevation_map,
      animals_list,
      species_list,
      program_store,
    }
  }

  pub(crate) fn world_dims(&self) -> WorldDims {
    self.world_dims
  }

  pub(crate) fn turn_no(&self) -> TurnNo {
    self.turn_no
  }

  pub(crate) fn rand_seed(&self) -> u64 {
    self.rand_seed
  }

  pub(crate) fn extra_flags(&self) -> &ExtraFlags {
    &self.extra_flags
  }

  pub(crate) fn elevation_map(&self) -> &ElevationMapPersist {
    &self.elevation_map
  }

  pub(crate) fn animals_list(&self) -> &AnimalsListPersist {
    &self.animals_list
  }

  pub(crate) fn species_list(&self) -> &SpeciesListPersist {
    &self.species_list
  }

  pub(crate) fn program_store(&self) -> &ProgramStorePersist {
    &self.program_store
  }
}
