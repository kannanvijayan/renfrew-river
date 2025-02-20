mod validate_rules_cmd;

pub(crate) use self::validate_rules_cmd::{
  ValidateRulesCmd,
  ValidateRulesRsp,
};

#[derive(Debug)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) enum DefineRulesSubcmdEnvelope {
  ValidateRules(ValidateRulesCmd),
}
