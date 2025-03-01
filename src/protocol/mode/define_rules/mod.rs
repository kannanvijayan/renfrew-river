mod subcommand;
mod response;
mod documentation;
mod update_rules_cmd;
mod save_rules_cmd;
mod load_rules_cmd;
mod current_rules_cmd;

pub(crate) use self::{
  subcommand::DefineRulesSubcmdEnvelope,
  response::DefineRulesSubcmdResponse,
  documentation::get_category_docs,
  update_rules_cmd::{ UpdateRulesCmd, UpdateRulesRsp },
  save_rules_cmd::SaveRulesCmd,
  load_rules_cmd::LoadRulesCmd,
  current_rules_cmd::{ CurrentRulesCmd, CurrentRulesRsp },
};

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct DefineRulesModeInfo {}
