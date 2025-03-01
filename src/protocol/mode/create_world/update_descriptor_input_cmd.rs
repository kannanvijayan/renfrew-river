use serde;
use crate::{
  protocol::{
    command::{ Command, CommandEnvelope },
    mode::create_world::CreateWorldSubcmdResponse,
    response::ResponseEnvelope,
  },
  world::{
    WorldDescriptorInput,
    WorldDescriptorValidation,
    WorldDimsInput,
    WorldDimsValidation
  },
};
use super::CreateWorldSubcmdEnvelope;

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct UpdateDescriptorInputCmd {
  pub(crate) descriptor: WorldDescriptorInput,
}

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) enum UpdateDescriptorInputRsp {
  Ok {},
  Invalid(WorldDescriptorValidation),
}
impl Command for UpdateDescriptorInputCmd {
  type Response = UpdateDescriptorInputRsp;
  fn name() -> &'static str {
    "UpdateDescriptorInput"
  }
  fn description() -> &'static str {
    "Update the descriptor input when specifying a new world."
  }
  fn to_queue_command(&self) -> CommandEnvelope {
    CommandEnvelope::CreateWorldSubcmd(
      CreateWorldSubcmdEnvelope::UpdateDescriptorInput(self.clone())
    )
  }
  fn embed_response(response: Self::Response) -> ResponseEnvelope {
    let subcmd_response = match response {
      UpdateDescriptorInputRsp::Ok {} =>
        CreateWorldSubcmdResponse::Ok {},
      UpdateDescriptorInputRsp::Invalid(validation) =>
        CreateWorldSubcmdResponse::InvalidWorldDescriptor(validation),
    };
    ResponseEnvelope::CreateWorldSubcmd(subcmd_response)
  }

  fn protocol_examples() -> (Vec<Self>, Vec<Self::Response>) {
    let update_descriptor_input_example = UpdateDescriptorInputCmd {
      descriptor: WorldDescriptorInput {
        name: "My World".to_string(),
        description: "My world description".to_string(),
        seed: "12345".to_string(),
        dims: WorldDimsInput {
          columns: "100".to_string(),
          rows: "100".to_string(),
        },
        ruleset_name: "Example Ruleset".to_string(),
      }
    };

    let update_descriptor_input_ok_response_example =
      UpdateDescriptorInputRsp::Ok {};
    
    let update_descriptor_input_err_response_example =
      UpdateDescriptorInputRsp::Invalid(WorldDescriptorValidation {
        errors: vec![
          "Name is required.".to_string(),
        ],
        name: vec![],
        description: vec!["Description is too long.".to_string()],
        seed: vec![],
        dims: WorldDimsValidation {
          errors: vec!["Columns is required.".to_string()],
          columns: vec![],
          rows: vec!["Rows must be a positive number.".to_string()],
        },
        ruleset_name: vec!["Ruleset name is required.".to_string()],
      });
    (
      vec![update_descriptor_input_example],
      vec![
        update_descriptor_input_ok_response_example,
        update_descriptor_input_err_response_example,
      ]
    )
  }
  fn protocol_notes() -> Vec<String> {
    vec![
    ]
  }
}
