use serde;
use crate::{
  game::defaults,
  protocol::{
    command::{ Command, CommandEnvelope },
    mode::create_world::CreateWorldSubcmdResponse,
    response::ResponseEnvelope,
  },
  world::{WorldDescriptorInput, WorldDescriptorValidation},
};
use super::CreateWorldSubcmdEnvelope;

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct CurrentDescriptorInputCmd {}

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct CurrentDescriptorInputRsp {
  pub(crate) descriptor: WorldDescriptorInput,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub(crate) validation: Option<WorldDescriptorValidation>,
}
impl Command for CurrentDescriptorInputCmd {
  type Response = CurrentDescriptorInputRsp;
  fn name() -> &'static str {
    "CurrentDescriptorInput"
  }
  fn description() -> &'static str {
    "Get the current descriptor input for specifying a new world."
  }
  fn to_queue_command(&self) -> CommandEnvelope {
    CommandEnvelope::CreateWorldSubcmd(
      CreateWorldSubcmdEnvelope::CurrentDescriptorInput(self.clone())
    )
  }
  fn embed_response(response: Self::Response) -> ResponseEnvelope {
    ResponseEnvelope::CreateWorldSubcmd(
      CreateWorldSubcmdResponse::CurrentDescriptorInput(response)
    )
  }

  fn protocol_examples() -> (Vec<Self>, Vec<Self::Response>) {
    let current_descriptor_input_example = CurrentDescriptorInputCmd {};

    let current_descriptor_input_response_example = CurrentDescriptorInputRsp {
      descriptor: defaults::world_descriptor_input(),
      validation: None,
    };
    (
      vec![current_descriptor_input_example],
      vec![current_descriptor_input_response_example],
    )
  }
  fn protocol_notes() -> Vec<String> {
    vec![
    ]
  }
}
