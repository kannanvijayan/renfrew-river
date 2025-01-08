use serde::{ Serialize, Deserialize };
use crate::{
  game::ExtraFlags,
  world::{ TurnNo, WorldDims }
};
use super::{
  ElevationMapPersist,
  AnimalsListPersist,
  SpeciesListPersist,
  UnitsListPersist,
  ProgramStorePersist,
};

/**
 * Persistable representation of a game.
 */
#[derive(Serialize, Deserialize)]
pub(crate) struct WorldPersist {
  world_dims: WorldDims,
  turn_no: TurnNo,
  rand_seed: u64,
  extra_flags: ExtraFlags,

  elevation_map: ElevationMapPersist,
  animals_list: AnimalsListPersist,
  species_list: SpeciesListPersist,
  unit_data: UnitsListPersist,
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
    unit_data: UnitsListPersist,
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
      unit_data,
      program_store,
    }
  }
}
