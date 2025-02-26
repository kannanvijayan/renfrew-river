use serde;
use super::{
  command::{ Command, CommandEnvelope },
  response::{FailedResponse, ResponseEnvelope}
};

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct EnterMainMenuModeCmd {
}

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) enum EnterMainMenuModeRsp {
  Ok,
  Error(Vec<String>),
}
impl Command for EnterMainMenuModeCmd {
  type Response = EnterMainMenuModeRsp;
  fn name() -> &'static str {
    "EnterMainMenuMode"
  }
  fn description() -> &'static str {
    "Enter the main menu mode."
  }
  fn to_queue_command(&self) -> CommandEnvelope {
    CommandEnvelope::EnterMainMenuMode(EnterMainMenuModeCmd {})
  }
  fn embed_response(response: Self::Response) -> ResponseEnvelope {
    match response {
      EnterMainMenuModeRsp::Ok => ResponseEnvelope::Ok {},
      EnterMainMenuModeRsp::Error(messages) =>
        ResponseEnvelope::Failed(FailedResponse::new_vec(messages)),
    }
  }

  fn protocol_examples() -> (Vec<Self>, Vec<Self::Response>) {
    let enter_mode_example = EnterMainMenuModeCmd {};

    let enter_mode_ok_response = EnterMainMenuModeRsp::Ok;
    let enter_mode_err_response = EnterMainMenuModeRsp::Error(vec![
      "Failed to enter main menu mode.".to_string(),
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
