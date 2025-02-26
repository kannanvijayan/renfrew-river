mod define_rules;
pub(crate) use self::define_rules::DefineRulesMode;

pub(crate) enum GameMode {
  DefineRules(DefineRulesMode),
}
