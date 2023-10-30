use serde;
use crate::game::{
  response::{ResponseEnvelope, FailedResponse},
  command::{Command, CommandEnvelope},
};

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct StopGameCmd;

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) enum StopGameRsp {
  Ok,
  Failed(FailedResponse),
}
impl Command for StopGameCmd {
  fn name() -> &'static str {
    "StopGame"
  }
  fn description() -> &'static str {
    "Stop the current game."
  }
  type Response = StopGameRsp;
  fn to_queue_command(&self) -> CommandEnvelope {
    CommandEnvelope::StopGame(Box::new(self.clone()))
  }
  fn extract_response(response: &ResponseEnvelope) -> Option<Self::Response> {
    match response {
      ResponseEnvelope::Ok{} => Some(StopGameRsp::Ok),
      ResponseEnvelope::Error(response) => Some(StopGameRsp::Failed(*response.clone())),
      _ => None,
    }
  }
  fn embed_response(response: Self::Response) -> ResponseEnvelope {
    match response {
      StopGameRsp::Ok => ResponseEnvelope::Ok{},
      StopGameRsp::Failed(response) => ResponseEnvelope::Error(Box::new(response)),
    }
  }
  fn protocol_examples() -> (Vec<Self>, Vec<Self::Response>) {
    let stop_game_example = StopGameCmd {};

    let stop_game_ok_response_example = StopGameRsp::Ok;
    let stop_game_failed_response_example = StopGameRsp::Failed(
      FailedResponse::new("No game to stop".to_string())
    );
    (
      vec![stop_game_example],
      vec![
        stop_game_ok_response_example,
        stop_game_failed_response_example,
      ]
    )
  }
}