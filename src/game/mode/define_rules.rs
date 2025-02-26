
use crate::{
  data_store::DataStore,
  protocol::mode::define_rules::{
    DefineRulesSubcmdEnvelope,
    DefineRulesSubcmdResponse,
    ValidateRulesCmd,
    ValidateRulesRsp,
  },
  ruleset::{RulesetInput, RulesetValidation}
};

pub(crate) struct DefineRulesMode {
  ruleset_input: Option<RulesetInput>,
  ruleset_validation: Option<RulesetValidation>,
}
impl DefineRulesMode {
  pub(crate) fn new() -> Self {
    DefineRulesMode {
      ruleset_input: None,
      ruleset_validation: None,
    }
  }

  pub(crate) fn handle_subcommand(&mut self,
    subcmd: DefineRulesSubcmdEnvelope,
    _data_store: &mut DataStore)
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
    let input = validate_rules_cmd.ruleset_input;
    self.ruleset_input = Some(input.clone());
    let maybe_rules = input.to_validated();
    let validation = match maybe_rules {
      Ok(_rules) => RulesetValidation::new_valid(),
      Err(validation) => validation,
    };
    let is_valid = validation.is_valid();
    let response = ValidateRulesRsp { is_valid, validation };
    DefineRulesSubcmdResponse::Validation(response)
  }
}
