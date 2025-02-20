use serde;
use crate::{
  game::{
    constants::{ ELEVATION_BITS, MIN_WORLD_DIMS, MAX_WORLD_DIMS },
    command::{Command, CommandEnvelope},
    response::ResponseEnvelope,
  },
  world::WorldDims,
};

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct GetConstantsCmd {}

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct GetConstantsRsp {
  #[serde(rename = "elevationBits")]
  pub(crate) elevation_bits: u32,

  #[serde(rename = "minWorldDims")]
  pub(crate) min_world_dims: WorldDims,

  #[serde(rename = "maxWorldDims")]
  pub(crate) max_world_dims: WorldDims,
}

impl Command for GetConstantsCmd {
  type Response = GetConstantsRsp;
  fn name() -> &'static str {
    "GetConstants"
  }
  fn description() -> &'static str {
    "Get various constants related to the game and protocol."
  }
  fn to_queue_command(&self) -> CommandEnvelope {
    CommandEnvelope::GetConstants(Box::new(self.clone()))
  }
  fn extract_response(response: &ResponseEnvelope) -> Option<Self::Response> {
    match response {
      ResponseEnvelope::Constants(get_constants_response) =>
        Some(get_constants_response.as_ref().clone()),
      _ => None,
    }
  }
  fn embed_response(response: Self::Response) -> ResponseEnvelope {
    ResponseEnvelope::Constants(Box::new(response))
  }
  fn protocol_examples() -> (Vec<Self>, Vec<Self::Response>) {
    let default_settings_example = GetConstantsCmd {};

    let response_example = GetConstantsRsp {
      elevation_bits: ELEVATION_BITS,
      min_world_dims: MIN_WORLD_DIMS,
      max_world_dims: MAX_WORLD_DIMS,
    };
    (
      vec![default_settings_example],
      vec![response_example],
    )
  }
}
