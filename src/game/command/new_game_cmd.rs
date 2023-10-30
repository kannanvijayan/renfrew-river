use serde;
use crate::game::{
  GameSettings,
  response::{ResponseEnvelope, FailedResponse},
  command::{Command, CommandEnvelope},
};

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct NewGameCmd {
  pub(crate) settings: GameSettings,
}
impl NewGameCmd {
  const WORLD_COLUMNS_MULTIPLE: u16 = 100;
  const WORLD_ROWS_MULTIPLE: u16 = 100;
}

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) enum NewGameRsp {
  Ok,
  Failed(FailedResponse),
}
impl Command for NewGameCmd {
  type Response = NewGameRsp;
  fn name() -> &'static str {
    "NewGame"
  }
  fn description() -> &'static str {
    "Start a new game with the given game settings."
  }
  fn to_queue_command(&self) -> CommandEnvelope {
    CommandEnvelope::NewGame(Box::new(self.clone()))
  }
  fn extract_response(response: &ResponseEnvelope) -> Option<Self::Response> {
    match response {
      ResponseEnvelope::Ok{} => Some(NewGameRsp::Ok),
      ResponseEnvelope::Error(response) => Some(NewGameRsp::Failed(*response.clone())),
      _ => None,
    }
  }
  fn embed_response(response: Self::Response) -> ResponseEnvelope {
    match response {
      NewGameRsp::Ok => ResponseEnvelope::Ok{},
      NewGameRsp::Failed(response) => ResponseEnvelope::Error(Box::new(response)),
    }
  }

  fn validate(&self, _errors: &mut Vec<String>) -> bool {
    let mut errored = false;
    if (self.settings.world_dims().columns % Self::WORLD_COLUMNS_MULTIPLE) != 0 {
      _errors.push(format!(
        "World columns must be a multiple of {}",
        Self::WORLD_COLUMNS_MULTIPLE
      ));
      errored = true;
    }
    if (self.settings.world_dims().rows % Self::WORLD_ROWS_MULTIPLE) != 0 {
      _errors.push(format!(
        "World rows must be a multiple of {}",
        Self::WORLD_ROWS_MULTIPLE
      ));
      errored = true;
    }
    !errored
  }

  fn protocol_examples() -> (Vec<Self>, Vec<Self::Response>) {
    let new_game_example = NewGameCmd {
      settings: GameSettings::default(),
    };

    let new_game_ok_response_example = NewGameRsp::Ok;
    let new_game_failed_response_example = NewGameRsp::Failed(
      FailedResponse::new("Failed to start game".to_string())
    );
    (
      vec![new_game_example],
      vec![
        new_game_ok_response_example,
        new_game_failed_response_example,
      ]
    )
  }
  fn protocol_notes() -> Vec<String> {
    vec![
      "Width and height must both be a multiple of 100".to_string(),
    ]
  }
}