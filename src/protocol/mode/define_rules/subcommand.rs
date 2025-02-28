
use super::{ UpdateRulesCmd, SaveRulesCmd, LoadRulesCmd, CurrentRulesCmd };

#[derive(Debug)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) enum DefineRulesSubcmdEnvelope {
  UpdateRules(UpdateRulesCmd),
  CurrentRules(CurrentRulesCmd),
  SaveRules(SaveRulesCmd),
  LoadRules(LoadRulesCmd),
}
