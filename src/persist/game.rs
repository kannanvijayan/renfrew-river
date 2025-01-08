use serde::{ Serialize, Deserialize };
use crate::{
  game::GameSettings,
  persist::WorldPersist,
};

/**
 * Persistable representation of a game.
 */
#[derive(Serialize, Deserialize)]
pub(crate) struct GamePersist {
  settings: GameSettings,
  world: WorldPersist,
}
impl GamePersist {
  pub(crate) fn new(settings: GameSettings, world: WorldPersist) -> GamePersist {
    GamePersist { settings, world }
  }
}
