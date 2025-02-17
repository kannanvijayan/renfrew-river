pub(crate) mod create_world;
pub(crate) mod define_rules;

use self::{
  create_world::CreateWorldMode,
  define_rules::DefineRulesMode,
};

pub(crate) enum GameMode {
  CreateWorld(CreateWorldMode),
  DefineRules(DefineRulesMode),
}
impl GameMode {
  pub(crate) fn new_create_world(name: String, description: String) -> Self {
    GameMode::CreateWorld(CreateWorldMode::new(name, description))
  }

  pub(crate) fn new_define_rules(name: String, description: String) -> Self {
    GameMode::DefineRules(DefineRulesMode::new(name, description))
  }
}
