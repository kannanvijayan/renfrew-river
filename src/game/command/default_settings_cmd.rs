use serde;
use crate::{
  game::{
    response::ResponseEnvelope,
    command::{Command, CommandEnvelope},
    GameSettings,
    settings::{ MIN_WORLD_DIMS, MAX_WORLD_DIMS },
  },
  world::WorldDims,
};

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct DefaultSettingsCmd {}

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct DefaultSettingsRsp {
  pub(crate) settings: GameSettings,
  pub(crate) min_world_dims: WorldDims,
  pub(crate) max_world_dims: WorldDims,
}

impl Command for DefaultSettingsCmd {
  type Response = DefaultSettingsRsp;
  fn name() -> &'static str {
    "DefaultSettings"
  }
  fn description() -> &'static str {
    "Get the default game settings."
  }
  fn to_queue_command(&self) -> CommandEnvelope {
    CommandEnvelope::DefaultSettings(Box::new(self.clone()))
  }
  fn extract_response(response: &ResponseEnvelope) -> Option<Self::Response> {
    match response {
      ResponseEnvelope::DefaultSettings(default_settings_response) =>
        Some(default_settings_response.as_ref().clone()),
      _ => None,
    }
  }
  fn embed_response(response: Self::Response) -> ResponseEnvelope {
    ResponseEnvelope::DefaultSettings(Box::new(response))
  }
  fn protocol_examples() -> (Vec<Self>, Vec<Self::Response>) {
    let default_settings_example = DefaultSettingsCmd {};

    let response_example = DefaultSettingsRsp {
      settings: GameSettings::default(),
      min_world_dims: MIN_WORLD_DIMS,
      max_world_dims: MAX_WORLD_DIMS,
    };
    (
      vec![default_settings_example],
      vec![response_example],
    )
  }
}
