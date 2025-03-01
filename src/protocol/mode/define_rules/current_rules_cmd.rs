use serde;
use crate::{
  protocol::{
    command::{ Command, CommandEnvelope },
    mode::define_rules::DefineRulesSubcmdResponse,
    response::ResponseEnvelope,
  },
  ruleset::{Ruleset, RulesetInput, RulesetValidation},
};
use super::DefineRulesSubcmdEnvelope;

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct CurrentRulesCmd {}

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct CurrentRulesRsp {
  pub(crate) ruleset: RulesetInput,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub(crate) validation: Option<RulesetValidation>,
}
impl Command for CurrentRulesCmd {
  type Response = CurrentRulesRsp;
  fn name() -> &'static str {
    "CurrentRules"
  }
  fn description() -> &'static str {
    "Save the current ruleset."
  }
  fn to_queue_command(&self) -> CommandEnvelope {
    CommandEnvelope::DefineRulesSubcmd(
      DefineRulesSubcmdEnvelope::CurrentRules(self.clone())
    )
  }
  fn embed_response(response: Self::Response) -> ResponseEnvelope {
    ResponseEnvelope::DefineRulesSubcmd(
      DefineRulesSubcmdResponse::CurrentRules(response)
    )
  }

  fn protocol_examples() -> (Vec<Self>, Vec<Self::Response>) {
    let current_rules_example = CurrentRulesCmd {};

    let current_rules_response_example = CurrentRulesRsp {
      ruleset: Ruleset::new_example().to_input(),
      validation: Some(RulesetValidation::new_example()),
    };
    (
      vec![current_rules_example],
      vec![current_rules_response_example],
    )
  }
  fn protocol_notes() -> Vec<String> {
    vec![
    ]
  }
}
