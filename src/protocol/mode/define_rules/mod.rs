mod command;
mod response;
mod documentation;
mod validate_rules_cmd;

pub(crate) use self::{
  command::DefineRulesSubcmdEnvelope,
  response::DefineRulesSubcmdResponse,
  documentation::get_category_docs,
  validate_rules_cmd::{ ValidateRulesCmd, ValidateRulesRsp },
};

pub(crate) struct DefineRulesMode {}
impl DefineRulesMode {
  pub(crate) fn new() -> Self {
    DefineRulesMode {}
  }

  pub(crate) fn handle_subcommand(&mut self, subcmd: DefineRulesSubcmdEnvelope)
    -> DefineRulesSubcmdResponse
  {
    match subcmd {
      DefineRulesSubcmdEnvelope::ValidateRules(validate_rules_cmd) =>
        self.handle_validate_rules_cmd(validate_rules_cmd)
    }
  }

  fn handle_validate_rules_cmd(&mut self, validate_rules_cmd: ValidateRulesCmd)
    -> DefineRulesSubcmdResponse
  {
    let validation = validate_rules_cmd.ruleset_input.validate();
    let is_valid = validation.is_valid();
    // let ValidateRulesCmd { ruleset_input } = validate_rules_cmd;
    DefineRulesSubcmdResponse::Validation(
      ValidateRulesRsp { is_valid, validation }
    )
  }
}

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct DefineRulesModeInfo {}
