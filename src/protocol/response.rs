use serde;
use crate::data::ruleset::RulesetEntry;
use super::mode::{
  define_rules::DefineRulesSubcmdResponse,
  create_world::CreateWorldSubcmdResponse,
  GameModeInfo
};

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) enum ResponseEnvelope {
  Ok {},
  Failed(FailedResponse),
  InMode(GameModeInfo),
  InMainMenuMode {},
  RulesetList(Vec<RulesetEntry>),
  DefineRulesSubcmd(DefineRulesSubcmdResponse),
  CreateWorldSubcmd(CreateWorldSubcmdResponse),
}

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct FailedResponse {
  messages: Vec<String>,
}
impl FailedResponse {
  pub(crate) fn new<S: AsRef<str>>(message: S) -> FailedResponse {
    FailedResponse { messages: vec![message.as_ref().to_owned()] }
  }

  pub(crate) fn new_vec(messages: Vec<String>) -> FailedResponse {
    FailedResponse { messages }
  }
}
