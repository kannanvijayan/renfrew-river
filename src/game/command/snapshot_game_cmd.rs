use serde;
use crate::game::{
  GameSettings,
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
  GameSnapshot(String),
  Failed(FailedResponse),
}
impl Command for SnapshotGameCmd {
  type Response = SnapshotGameRsp;
  fn name() -> &'static str {
    "NewGame"
  }
  fn description() -> &'static str {
    "Start a new game with the given game settings."
  }
  fn to_queue_command(&self) -> CommandEnvelope {
    CommandEnvelope::SnapshotGame(Box::new(self.clone()))
  }
  fn extract_response(response: &ResponseEnvelope) -> Option<Self::Response> {
    match response {
      ResponseEnvelope::GameSnapshot(game_snapshot) => Some(*game_snapshot.clone()),
      ResponseEnvelope::Error(response) => Some(SnapshotGameRsp::Failed(*response.clone())),
      _ => None,
    }
  }
  fn embed_response(response: Self::Response) -> ResponseEnvelope {
    match response {
      SnapshotGameRsp::GameSnapshot(game_snapshot) =>
        ResponseEnvelope::GameSnapshot(
          Box::new(SnapshotGameRsp::GameSnapshot(game_snapshot))
        ),
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
      "Game snapshot data".to_string()
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
