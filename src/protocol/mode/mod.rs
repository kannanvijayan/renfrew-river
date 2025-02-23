pub(crate) mod define_rules;

use self::define_rules::{ DefineRulesMode, DefineRulesModeInfo };

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) enum GameModeInfo {
  DefineRules(DefineRulesModeInfo),
}
impl GameModeInfo {
}

pub(crate) enum GameMode {
  DefineRules(DefineRulesMode),
}
impl GameMode {
  pub(crate) fn new_define_rules() -> Self {
    GameMode::DefineRules(DefineRulesMode::new())
  }
  pub(crate) fn is_define_rules(&self) -> bool {
    matches!(self, GameMode::DefineRules(_))
  }
}
