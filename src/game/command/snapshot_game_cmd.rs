use serde;
use crate::game::{
  response::{ResponseEnvelope, FailedResponse},
  command::{Command, CommandEnvelope},
};

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct SnapshotGameCmd {
}

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) enum SnapshotGameRsp {
  GameSnapshot(GameSnapshotResponse),
  Failed(FailedResponse),
}

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct GameSnapshotResponse {
  data: String,
}
impl GameSnapshotResponse {
  pub(crate) fn new(data: String) -> GameSnapshotResponse {
    GameSnapshotResponse { data }
  }

  pub(crate) fn data(&self) -> &String {
    &self.data
  }
}

impl Command for SnapshotGameCmd {
  type Response = SnapshotGameRsp;
  fn name() -> &'static str {
    "SnapshotGame"
  }
  fn description() -> &'static str {
    "Obtain a snapshot of the current game."
  }
  fn to_queue_command(&self) -> CommandEnvelope {
    CommandEnvelope::SnapshotGame(Box::new(self.clone()))
  }
  fn extract_response(response: &ResponseEnvelope) -> Option<Self::Response> {
    match response {
      ResponseEnvelope::GameSnapshot(game_snapshot) =>
        Some(SnapshotGameRsp::GameSnapshot(*game_snapshot.clone())),
      ResponseEnvelope::Error(response) => Some(SnapshotGameRsp::Failed(*response.clone())),
      _ => None,
    }
  }
  fn embed_response(response: Self::Response) -> ResponseEnvelope {
    match response {
      SnapshotGameRsp::GameSnapshot(game_snapshot) =>
        ResponseEnvelope::GameSnapshot(Box::new(game_snapshot)),
      SnapshotGameRsp::Failed(response) =>
        ResponseEnvelope::Error(Box::new(response)),
    }
  }

  fn validate(&self, _errors: &mut Vec<String>) -> bool {
    true
  }

  fn protocol_examples() -> (Vec<Self>, Vec<Self::Response>) {
    let snapshot_game_example = SnapshotGameCmd {};

    let game_snapshot_response_example = SnapshotGameRsp::GameSnapshot(
      GameSnapshotResponse::new("Game snapshot data".to_string())
    );
    let game_snapshot_failed_example = SnapshotGameRsp::Failed(
      FailedResponse::new("Failed to snapshot game".to_string())
    );
    (
      vec![snapshot_game_example],
      vec![game_snapshot_response_example, game_snapshot_failed_example],
    )
  }
  fn protocol_notes() -> Vec<String> {
    vec![
      "The returned string should be treated as opaque.".to_string(),
      "See `RestoreGame` command for loading snapshots.".to_string(),
    ]
  }
}
