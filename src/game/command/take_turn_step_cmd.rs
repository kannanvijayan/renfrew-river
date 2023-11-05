use serde;
use crate::{
  world::TurnNo,
  game::{
    response::{ ResponseEnvelope, FailedResponse },
    command::{Command, CommandEnvelope},
  },
};

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct TakeTurnStepCmd {}

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) enum TakeTurnStepRsp {
  TurnTaken(TurnTakenResponse),
  Failed(FailedResponse),
}

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct TurnTakenResponse {
  pub(crate) turn_no_after: TurnNo,
  pub(crate) elapsed_ms: u32,
}

impl Command for TakeTurnStepCmd {
  type Response = TakeTurnStepRsp;
  fn name() -> &'static str {
    "TakeTurnStep"
  }
  fn description() -> &'static str {
    "Take the next turn step."
  }
  fn to_queue_command(&self) -> CommandEnvelope {
    CommandEnvelope::TakeTurnStep(Box::new(self.clone()))
  }
  fn extract_response(response: &ResponseEnvelope) -> Option<Self::Response> {
    match response {
      ResponseEnvelope::TurnTaken(take_turn_step_response) =>
        Some(
          TakeTurnStepRsp::TurnTaken(take_turn_step_response.as_ref().clone())
        ),
      _ => None,
    }
  }
  fn embed_response(response: Self::Response) -> ResponseEnvelope {
    match response {
      TakeTurnStepRsp::TurnTaken(response) =>
        ResponseEnvelope::TurnTaken(Box::new(response)),
      TakeTurnStepRsp::Failed(response) =>
        ResponseEnvelope::Error(Box::new(response)),
    }
  }
  fn protocol_examples() -> (Vec<Self>, Vec<Self::Response>) {
    let default_settings_example = TakeTurnStepCmd {};

    let response_example = TakeTurnStepRsp::TurnTaken(TurnTakenResponse {
      turn_no_after: TurnNo(29),
      elapsed_ms: 123,
    });
    (
      vec![default_settings_example],
      vec![response_example],
    )
  }
}
