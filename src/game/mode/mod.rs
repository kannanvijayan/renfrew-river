mod define_rules;
mod create_world;

pub(crate) use self::{
  define_rules::DefineRulesMode,
  create_world::CreateWorldMode,
};

pub(crate) enum GameMode {
  DefineRules(DefineRulesMode),
  CreateWorld(CreateWorldMode),
}
