use log;
use crate::{
  game::GameSettings,
  world::World,
};

pub(crate) struct Game {
  settings: GameSettings,
  world: World,
}
impl Game {
  pub(crate) fn new(settings: GameSettings) -> Game {
    log::debug!("Game::new");
    let world = World::new(settings.world_init_params());
    Game {
      settings,
      world
    }
  }

  pub(crate) fn settings(&self) -> &GameSettings {
    &self.settings
  }

  pub(crate) fn initialize(&mut self) {
    log::debug!("Game::initialize");
    self.world.initialize();
  }

  pub(crate) fn stop(&mut self) {
    log::debug!("Game::stop");
  }

  pub(crate) fn world(&self) -> &World {
    &self.world
  }
}
