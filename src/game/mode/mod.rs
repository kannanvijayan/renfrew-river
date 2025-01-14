pub(crate) mod create_world;

use self::create_world::CreateWorldMode;

pub(crate) enum GameMode {
  CreateWorld(CreateWorldMode),
}
impl GameMode {
  pub(crate) fn new_create_world(name: String, description: String) -> Self {
    GameMode::CreateWorld(CreateWorldMode::new(name, description))
  }
}
