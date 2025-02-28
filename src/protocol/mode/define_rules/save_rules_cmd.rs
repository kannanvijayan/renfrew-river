use serde;
use crate::protocol::{
  command::{ Command, CommandEnvelope },
  mode::define_rules::response::DefineRulesSubcmdResponse,
  response::ResponseEnvelope,
};
use super::DefineRulesSubcmdEnvelope;

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct SaveRulesCmd {}

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) enum SaveRulesRsp {
  Ok,
  Failed(Vec<String>),
}
impl Command for SaveRulesCmd {
  type Response = SaveRulesRsp;
  fn name() -> &'static str {
    "SaveRules"
  }
  fn description() -> &'static str {
    "Save the current ruleset."
  }
  fn to_queue_command(&self) -> CommandEnvelope {
    CommandEnvelope::DefineRulesSubcmd(
      DefineRulesSubcmdEnvelope::SaveRules(self.clone())
    )
  }
  fn embed_response(response: Self::Response) -> ResponseEnvelope {
    let subcmd_response = match response {
      SaveRulesRsp::Ok => DefineRulesSubcmdResponse::Ok {},
      SaveRulesRsp::Failed(messages) =>
        DefineRulesSubcmdResponse::Failed(messages)
    };
    ResponseEnvelope::DefineRulesSubcmd(subcmd_response)
  }

  fn protocol_examples() -> (Vec<Self>, Vec<Self::Response>) {
    let save_rules_example = SaveRulesCmd {};

    let save_rules_ok_response_example = SaveRulesRsp::Ok;
    let save_rules_err_response_example = SaveRulesRsp::Failed(vec![
      "Ruleset is not valid.".to_string(),
    ]);
    (
      vec![save_rules_example],
      vec![
        save_rules_ok_response_example,
        save_rules_err_response_example,
      ]
    )
  }
  fn protocol_notes() -> Vec<String> {
    vec![
    ]
  }
}
