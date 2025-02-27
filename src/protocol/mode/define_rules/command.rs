
use super::{ ValidateRulesCmd, SaveRulesCmd };

#[derive(Debug)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) enum DefineRulesSubcmdEnvelope {
  ValidateRules(ValidateRulesCmd),
  SaveRules(SaveRulesCmd),
}
