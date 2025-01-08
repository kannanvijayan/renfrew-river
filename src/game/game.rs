use log;
use crate::{
  game::GameSettings,
  world::World,
  persist::GamePersist,
};

pub(crate) struct Game {
  settings: GameSettings,
  world: World,
}
impl Game {
  pub(crate) fn new(settings: GameSettings) -> Game {
    log::debug!("Game::new");
    let world = World::new(settings.world_init_params());
    Game { settings, world }
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
  pub(crate) fn world_mut(&mut self) -> &mut World {
    &mut self.world
  }

  pub(crate) fn to_persist(&self) -> GamePersist {
    GamePersist::new(self.settings.clone(), self.world.to_persist())
  }

  pub(crate) fn from_persist(persist: GamePersist) -> Game {
    Game {
      settings: persist.settings().clone(),
      world: World::from_persist(persist.world()),
    }
  }
}
