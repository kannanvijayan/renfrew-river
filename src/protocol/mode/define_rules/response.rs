use super::validate_rules_cmd::ValidateRulesRsp;

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) enum DefineRulesSubcmdResponse {
  Validation(ValidateRulesRsp),
  Failed(Vec<String>)
}
