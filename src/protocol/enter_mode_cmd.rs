use serde;
use super::{
  command::{ Command, CommandEnvelope },
  mode::{
    define_rules::DefineRulesModeInfo,
    GameModeInfo,
  },
  response::{ FailedResponse, ResponseEnvelope },
};

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct EnterModeCmd {
  pub(crate) mode: GameModeInfo,
}

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) enum EnterModeRsp {
  Ok,
  Error(Vec<String>),
}
impl Command for EnterModeCmd {
  type Response = EnterModeRsp;
  fn name() -> &'static str {
    "EnterMode"
  }
  fn description() -> &'static str {
    "Enter the specified mode."
  }
  fn to_queue_command(&self) -> CommandEnvelope {
    CommandEnvelope::EnterMode(EnterModeCmd { mode: self.mode.clone() })
  }
  fn embed_response(response: Self::Response) -> ResponseEnvelope {
    match response {
      EnterModeRsp::Ok => ResponseEnvelope::Ok {},
      EnterModeRsp::Error(messages) =>
        ResponseEnvelope::Failed(FailedResponse::new_vec(messages)),
    }
  }

  fn protocol_examples() -> (Vec<Self>, Vec<Self::Response>) {
    let enter_mode_example = EnterModeCmd {
      mode: GameModeInfo::DefineRules(DefineRulesModeInfo {})
    };

    let enter_mode_ok_response = EnterModeRsp::Ok;
    let enter_mode_err_response = EnterModeRsp::Error(vec![
      "Already in mode 'CreateWorld'.".to_string(),
    ]);
    (
      vec![enter_mode_example],
      vec![
        enter_mode_ok_response,
        enter_mode_err_response,
      ]
    )
  }
  fn protocol_notes() -> Vec<String> {
    vec![
    ]
  }
}
