use serde;
use crate::{
  protocol::{
    command::{ Command, CommandEnvelope },
    mode::create_world::CreateWorldSubcmdResponse,
    response::ResponseEnvelope,
  },
  ruleset::{ Ruleset, TerrainGenRules },
  world::{WorldDescriptor, WorldDims},
};
use super::CreateWorldSubcmdEnvelope;

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct BeginNewWorldCmd {
  pub(crate) descriptor: WorldDescriptor,
}

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) enum BeginNewWorldRsp {
  Ok {},
  Failed(Vec<String>),
}
impl Command for BeginNewWorldCmd {
  type Response = BeginNewWorldRsp;
  fn name() -> &'static str {
    "BeginNewWorld"
  }
  fn description() -> &'static str {
    "Begin the generation of a new world."
  }
  fn to_queue_command(&self) -> CommandEnvelope {
    CommandEnvelope::CreateWorldSubcmd(
      CreateWorldSubcmdEnvelope::BeginNewWorld(self.clone())
    )
  }
  fn embed_response(response: Self::Response) -> ResponseEnvelope {
    let subcmd_response = match response {
      BeginNewWorldRsp::Ok {} => CreateWorldSubcmdResponse::Ok {},
      BeginNewWorldRsp::Failed(messages) =>
        CreateWorldSubcmdResponse::Failed(messages)
    };
    ResponseEnvelope::CreateWorldSubcmd(subcmd_response)
  }

  fn protocol_examples() -> (Vec<Self>, Vec<Self::Response>) {
    let begin_new_world_example = BeginNewWorldCmd {
      descriptor: WorldDescriptor {
        name: "MyWorld".to_string(),
        description: "My own little world".to_string(),
        seed: "random1234".to_string(),
        dims: WorldDims::new(1000, 1000),
        ruleset_name: "FreeCiv".to_string(),
      }
    };

    let begin_new_world_ok_response_example = BeginNewWorldRsp::Ok {};
    let begin_new_world_err_response_example = BeginNewWorldRsp::Failed(vec![
      "No such ruleset.".to_string(),
    ]);
    (
      vec![begin_new_world_example],
      vec![
        begin_new_world_ok_response_example,
        begin_new_world_err_response_example,
      ]
    )
  }
  fn protocol_notes() -> Vec<String> {
    vec![
    ]
  }
}
