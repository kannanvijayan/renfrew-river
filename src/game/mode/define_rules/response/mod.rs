use super::command::ValidateRulesRsp;

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) enum DefineRulesSubcmdResponse {
  Validation(ValidateRulesRsp),
  Failed(Vec<String>)
}
