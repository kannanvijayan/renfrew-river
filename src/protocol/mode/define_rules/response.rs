use crate::ruleset::{ Ruleset, RulesetValidation };
use super::current_rules_cmd::CurrentRulesRsp;

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) enum DefineRulesSubcmdResponse {
  InvalidRuleset(RulesetValidation),
  CurrentRules(CurrentRulesRsp),
  LoadedRuleset(Ruleset),
  Ok {},
  Failed(Vec<String>)
}
