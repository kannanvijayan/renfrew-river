use crate::ruleset::{Ruleset, RulesetValidation};

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) enum CreateWorldSubcmdResponse {
  Ok {},
  Failed(Vec<String>),
}
