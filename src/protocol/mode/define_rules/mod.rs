mod command;
mod response;
mod documentation;
mod validate_rules_cmd;
mod save_rules_cmd;

pub(crate) use self::{
  command::DefineRulesSubcmdEnvelope,
  response::DefineRulesSubcmdResponse,
  documentation::get_category_docs,
  validate_rules_cmd::{ ValidateRulesCmd, ValidateRulesRsp },
  save_rules_cmd::{ SaveRulesCmd, SaveRulesRsp },
};

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct DefineRulesModeInfo {}
