pub(crate) mod define_rules;
pub(crate) mod create_world;

use self::{
  define_rules::DefineRulesModeInfo,
  create_world::CreateWorldModeInfo,
};

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) enum GameModeInfo {
  DefineRules(DefineRulesModeInfo),
  CreateWorld(CreateWorldModeInfo),
}
impl GameModeInfo {
}
