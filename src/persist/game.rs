use serde::{ Serialize, Deserialize };
use crate::{
  game::GameSettings,
  persist::WorldPersist,
};

/**
 * Persistable representation of a game.
 */
#[derive(Debug, Clone)]
#[derive(Serialize, Deserialize)]
pub(crate) struct GamePersist {
  settings: GameSettings,
  world: WorldPersist,
}
impl GamePersist {
  pub(crate) fn new(settings: GameSettings, world: WorldPersist) -> GamePersist {
    GamePersist { settings, world }
  }

  pub(crate) fn settings(&self) -> &GameSettings {
    &self.settings
  }

  pub(crate) fn world(&self) -> &WorldPersist {
    &self.world
  }
}
