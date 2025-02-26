
use crate::protocol::mode::define_rules::{
  DefineRulesSubcmdEnvelope,
  DefineRulesSubcmdResponse,
  ValidateRulesCmd,
  ValidateRulesRsp,
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
