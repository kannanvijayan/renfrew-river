pub(crate) mod define_rules;

use self::define_rules::DefineRulesMode;

pub(crate) enum GameMode {
  DefineRules(DefineRulesMode),
}
impl GameMode {
  pub(crate) fn new_define_rules(name: String, description: String) -> Self {
    GameMode::DefineRules(DefineRulesMode::new(name, description))
  }
}
