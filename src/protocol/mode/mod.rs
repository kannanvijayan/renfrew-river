pub(crate) mod define_rules;

use self::define_rules::DefineRulesModeInfo;

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) enum GameModeInfo {
  DefineRules(DefineRulesModeInfo),
}
impl GameModeInfo {
}
