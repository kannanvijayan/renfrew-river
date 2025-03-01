
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
  update_existing: Option<String>,
  ruleset_input: RulesetInput,
}
impl DefineRulesMode {
  pub(crate) fn new() -> Self {
    DefineRulesMode {
      update_existing: None,
      ruleset_input: RulesetInput::new()
    }
  }

  pub(crate) fn handle_subcommand(&mut self,
    subcmd: DefineRulesSubcmdEnvelope,
    data_store: &mut DataStore
  ) -> DefineRulesSubcmdResponse {
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

  fn update_existing_ref(&self) -> Option<&str> {
    self.update_existing.as_ref().map(|s| s.as_str())
  }

  fn handle_update_rules_cmd(&mut self,
    update_rules_cmd: UpdateRulesCmd,
    data_store: &DataStore)
    -> DefineRulesSubcmdResponse
  {
    let input = update_rules_cmd.ruleset_input;
    self.ruleset_input = input.clone();
    let maybe_rules = input.to_validated(data_store, self.update_existing_ref());
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
    let maybe_rules = ruleset.to_validated(data_store, self.update_existing_ref());
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
    if let Some(name) = &self.update_existing {
      self.update_existing_ruleset(name, data_store)
    } else {
      self.save_new_ruleset(data_store)
    }
  }

  fn update_existing_ruleset(&self, name: &str, data_store: &DataStore)
    -> DefineRulesSubcmdResponse
  {
    if name != &self.ruleset_input.name {
      // If the name has changed, remove the old ruleset and replace
      // it with the new one.
      data_store.rulesets().delete(name);
      return self.save_new_ruleset(data_store);
    }

    let maybe_rules = self.ruleset_input.to_validated(data_store, Some(name));
    match maybe_rules {
      Ok(rules) => {
        data_store.rulesets().write(name, &rules);
        DefineRulesSubcmdResponse::Ok {}
      },
      Err(_validation) => {
        DefineRulesSubcmdResponse::Failed(vec![
          "Ruleset is not valid.".to_string()
        ])
      },
    }
  }

  fn save_new_ruleset(&self, data_store: &DataStore) -> DefineRulesSubcmdResponse {
    let maybe_rules = self.ruleset_input.to_validated(data_store, None);
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
    self.update_existing = Some(ruleset_name);
    DefineRulesSubcmdResponse::LoadedRuleset(rules)
  }
}
