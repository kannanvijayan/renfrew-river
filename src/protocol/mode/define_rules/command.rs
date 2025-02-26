
use super::validate_rules_cmd::ValidateRulesCmd;

#[derive(Debug)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) enum DefineRulesSubcmdEnvelope {
  ValidateRules(ValidateRulesCmd),
}
