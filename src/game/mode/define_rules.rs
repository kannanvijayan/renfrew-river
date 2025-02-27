
use crate::{
  data_store::DataStore,
  protocol::mode::define_rules::{
    DefineRulesSubcmdEnvelope, DefineRulesSubcmdResponse, SaveRulesCmd, ValidateRulesCmd, ValidateRulesRsp
  },
  ruleset::{RulesetInput, RulesetValidation}
};

pub(crate) struct DefineRulesMode {
  ruleset_input: Option<RulesetInput>,
}
impl DefineRulesMode {
  pub(crate) fn new() -> Self {
    DefineRulesMode { ruleset_input: None }
  }

  pub(crate) fn handle_subcommand(&mut self,
    subcmd: DefineRulesSubcmdEnvelope,
    data_store: &mut DataStore)
    -> DefineRulesSubcmdResponse
  {
    match subcmd {
      DefineRulesSubcmdEnvelope::ValidateRules(validate_rules_cmd) =>
        self.handle_validate_rules_cmd(validate_rules_cmd, data_store),

      DefineRulesSubcmdEnvelope::SaveRules(save_rules_cmd) =>
        self.handle_save_rules_cmd(save_rules_cmd, data_store),
    }
  }

  fn handle_validate_rules_cmd(&mut self,
    validate_rules_cmd: ValidateRulesCmd,
    data_store: &DataStore)
    -> DefineRulesSubcmdResponse
  {
    let input = validate_rules_cmd.ruleset_input;
    self.ruleset_input = Some(input.clone());
    let maybe_rules = input.to_validated(data_store);
    let validation = match maybe_rules {
      Ok(_rules) => RulesetValidation::new_valid(),
      Err(validation) => validation,
    };
    let is_valid = validation.is_valid();
    let response = ValidateRulesRsp { is_valid, validation };
    DefineRulesSubcmdResponse::Validation(response)
  }

  fn handle_save_rules_cmd(&mut self,
    _save_rules_cmd: SaveRulesCmd,
    data_store: &mut DataStore
  ) -> DefineRulesSubcmdResponse {
    if let Some(ruleset_input) = &self.ruleset_input {
      let maybe_rules = ruleset_input.to_validated(data_store);
      match maybe_rules {
        Ok(rules) => {
          data_store.rulesets().write(&rules.name, &rules);
          DefineRulesSubcmdResponse::RulesSaved {}
        },
        Err(_validation) => {
          DefineRulesSubcmdResponse::Failed(vec![
            "Ruleset is not valid.".to_string()
          ])
        },
      }
    } else {
      DefineRulesSubcmdResponse::Failed(vec!["No ruleset to save.".to_string()])
    }
  }
}
