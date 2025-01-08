use serde;
use crate::game::{
  response::{ResponseEnvelope, FailedResponse},
  command::{Command, CommandEnvelope},
};

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct RestoreGameCmd {
  pub(crate) snapshot: String,
}

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) enum RestoreGameRsp {
  Ok,
  Failed(FailedResponse),
}
impl Command for RestoreGameCmd {
  type Response = RestoreGameRsp;
  fn name() -> &'static str {
    "RestoreGame"
  }
  fn description() -> &'static str {
    "Restore a snapshot of a game."
  }
  fn to_queue_command(&self) -> CommandEnvelope {
    CommandEnvelope::RestoreGame(Box::new(self.clone()))
  }
  fn extract_response(response: &ResponseEnvelope) -> Option<Self::Response> {
    match response {
      ResponseEnvelope::Ok {} => Some(RestoreGameRsp::Ok),
      ResponseEnvelope::Error(response) => Some(RestoreGameRsp::Failed(*response.clone())),
      _ => None,
    }
  }
  fn embed_response(response: Self::Response) -> ResponseEnvelope {
    match response {
      RestoreGameRsp::Ok => ResponseEnvelope::Ok {},
      RestoreGameRsp::Failed(response) =>
        ResponseEnvelope::Error(Box::new(response)),
    }
  }

  fn validate(&self, _errors: &mut Vec<String>) -> bool {
    true
  }

  fn protocol_examples() -> (Vec<Self>, Vec<Self::Response>) {
    let snapshot_game_example = RestoreGameCmd {
      snapshot: "Game snapshot data".to_string(),
    };

    let restore_snapshot_response_example = RestoreGameRsp::Ok;
    let restore_snapshot_failed_example = RestoreGameRsp::Failed(
      FailedResponse::new("Failed to restore snapshot".to_string())
    );
    (
      vec![snapshot_game_example],
      vec![restore_snapshot_response_example, restore_snapshot_failed_example],
    )
  }
  fn protocol_notes() -> Vec<String> {
    vec![
      "The returned string should be treated as opaque.".to_string(),
      "See `RestoreGame` command for loading snapshots.".to_string(),
    ]
  }
}
