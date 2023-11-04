use serde;
use crate::game::{
  GameSettings,
  command::{ Command, CommandEnvelope },
  response::ResponseEnvelope,
};

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct HasGameCmd {}

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) enum HasGameRsp {
  GameExists(GameExistsResponse),
  NoGameExists,
}

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct GameExistsResponse {
  settings: GameSettings,
}
impl GameExistsResponse {
  pub(crate) fn new(settings: GameSettings) -> GameExistsResponse {
    GameExistsResponse { settings }
  }
}

impl Command for HasGameCmd {
  type Response = HasGameRsp;
  fn name() -> &'static str {
    "HasGame"
  }
  fn description() -> &'static str {
    "Check if a game has been started."
  }
  fn to_queue_command(&self) -> CommandEnvelope {
    CommandEnvelope::HasGame(Box::new(self.clone()))
  }
  fn extract_response(response: &ResponseEnvelope) -> Option<Self::Response> {
    match response {
      ResponseEnvelope::GameExists(game_exists_response) =>
        Some(HasGameRsp::GameExists(*game_exists_response.clone())),
      ResponseEnvelope::NoGameExists{} => Some(HasGameRsp::NoGameExists),
      _ => None,
    }
  }
  fn embed_response(response: Self::Response) -> ResponseEnvelope {
    match response {
      HasGameRsp::GameExists(game_exists_response) =>
        ResponseEnvelope::GameExists(Box::new(game_exists_response)),
      HasGameRsp::NoGameExists => ResponseEnvelope::NoGameExists{},
    }
  }
  fn protocol_examples() -> (Vec<Self>, Vec<Self::Response>) {
    let new_game_example = HasGameCmd {};

    let game_exists_example = HasGameRsp::GameExists(
      GameExistsResponse::new(GameSettings::default())
    );
    let no_game_exists_example = HasGameRsp::NoGameExists;
    (
      vec![new_game_example],
      vec![
        game_exists_example,
        no_game_exists_example,
      ]
    )
  }
}
