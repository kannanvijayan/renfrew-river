
use crate::{
  data_store::DataStore,
  protocol::mode::define_rules::{
    DefineRulesSubcmdEnvelope,
    DefineRulesSubcmdResponse,
    SaveRulesCmd,
    LoadRulesCmd,
    UpdateRulesCmd,
    CurrentRulesCmd,
    CurrentRulesRsp,
  },
  ruleset::RulesetInput,
};

pub(crate) struct DefineRulesMode {
  ruleset_input: RulesetInput,
}
impl DefineRulesMode {
  pub(crate) fn new() -> Self {
    DefineRulesMode { ruleset_input: RulesetInput::new() }
  }

  pub(crate) fn handle_subcommand(&mut self,
    subcmd: DefineRulesSubcmdEnvelope,
    data_store: &mut DataStore)
    -> DefineRulesSubcmdResponse
  {
    match subcmd {
      DefineRulesSubcmdEnvelope::UpdateRules(update_rules_cmd) =>
        self.handle_update_rules_cmd(update_rules_cmd, data_store),
      
      DefineRulesSubcmdEnvelope::CurrentRules(current_rules_cmd) =>
        self.handle_current_rules_cmd(current_rules_cmd, data_store),

      DefineRulesSubcmdEnvelope::SaveRules(save_rules_cmd) =>
        self.handle_save_rules_cmd(save_rules_cmd, data_store),

      DefineRulesSubcmdEnvelope::LoadRules(load_rules_cmd) =>
        self.handle_load_rules_cmd(load_rules_cmd, data_store),
    }
  }

  fn handle_update_rules_cmd(&mut self,
    update_rules_cmd: UpdateRulesCmd,
    data_store: &DataStore)
    -> DefineRulesSubcmdResponse
  {
    let input = update_rules_cmd.ruleset_input;
    self.ruleset_input = input.clone();
    let maybe_rules = input.to_validated(data_store);
    match maybe_rules {
      Ok(_rules) => DefineRulesSubcmdResponse::Ok {},
      Err(validation) => DefineRulesSubcmdResponse::InvalidRuleset(validation),
    }
  }

  fn handle_current_rules_cmd(&mut self,
    _current_rules_cmd: CurrentRulesCmd,
    data_store: &DataStore
  ) -> DefineRulesSubcmdResponse {
    let ruleset = self.ruleset_input.clone();
    let maybe_rules = ruleset.to_validated(data_store);
    let validation = match maybe_rules {
      Ok(_rules) => None,
      Err(validation) => Some(validation),
    };
    DefineRulesSubcmdResponse::CurrentRules(CurrentRulesRsp {
      ruleset, validation
    })
  }

  fn handle_save_rules_cmd(&mut self,
    _save_rules_cmd: SaveRulesCmd,
    data_store: &mut DataStore
  ) -> DefineRulesSubcmdResponse {
    let maybe_rules = self.ruleset_input.to_validated(data_store);
    match maybe_rules {
      Ok(rules) => {
        data_store.rulesets().write(&rules.name, &rules);
        DefineRulesSubcmdResponse::Ok {}
      },
      Err(_validation) => {
        DefineRulesSubcmdResponse::Failed(vec![
          "Ruleset is not valid.".to_string()
        ])
      },
    }
  }

  fn handle_load_rules_cmd(&mut self,
    load_rules_cmd: LoadRulesCmd,
    data_store: &DataStore
  ) -> DefineRulesSubcmdResponse {
    let ruleset_name = load_rules_cmd.ruleset_name.clone();
    let rulesets = data_store.rulesets().list();
    if ! rulesets.iter().any(|entry| entry.name == ruleset_name) {
      return DefineRulesSubcmdResponse::Failed(vec![
        "No such ruleset.".to_string(),
        ruleset_name.to_string(),
      ]);
    }
    let rules = data_store.rulesets().read(&ruleset_name);
    self.ruleset_input = rules.to_input();
    DefineRulesSubcmdResponse::LoadedRuleset(rules)
  }
}
