use serde;
use crate::protocol::{
  command::{ Command, CommandEnvelope },
  mode::create_world::CreateWorldSubcmdResponse,
  response::ResponseEnvelope
};
use super::CreateWorldSubcmdEnvelope;

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct BeginGenerationCmd {}

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) enum BeginGenerationRsp {
  Ok {},
  Failed(String),
}
impl Command for BeginGenerationCmd {
  type Response = BeginGenerationRsp;
  fn name() -> &'static str {
    "BeginGeneration"
  }
  fn description() -> &'static str {
    "Begin world generation."
  }
  fn to_queue_command(&self) -> CommandEnvelope {
    CommandEnvelope::CreateWorldSubcmd(
      CreateWorldSubcmdEnvelope::BeginGeneration(self.clone())
    )
  }
  fn embed_response(response: Self::Response) -> ResponseEnvelope {
    match response {
      BeginGenerationRsp::Ok {} => ResponseEnvelope::CreateWorldSubcmd(
        CreateWorldSubcmdResponse::Ok {}
      ),
      BeginGenerationRsp::Failed(message) => ResponseEnvelope::CreateWorldSubcmd(
        CreateWorldSubcmdResponse::Failed(vec![message])
      ),
    }
  }

  fn protocol_examples() -> (Vec<Self>, Vec<Self::Response>) {
    let begin_generation_example = BeginGenerationCmd {};

    let begin_generation_ok_response = BeginGenerationRsp::Ok {};
    let begin_generation_failed_response = BeginGenerationRsp::Failed(
      "World descriptor input is not valid.".to_string()
    );
    (
      vec![begin_generation_example],
      vec![
        begin_generation_ok_response,
        begin_generation_failed_response,
      ]
    )
  }
  fn protocol_notes() -> Vec<String> {
    vec![
      "For this command to succeed, the world descriptor input must be valid."
        .to_string(),
    ]
  }
}
