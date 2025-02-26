use serde;

use crate::ruleset::RulesetEntry;
use super::mode::{
  define_rules::DefineRulesSubcmdResponse,
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
