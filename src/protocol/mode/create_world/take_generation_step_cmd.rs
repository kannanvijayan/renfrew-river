use serde;
use crate::{
  protocol::{
    command::{ Command, CommandEnvelope },
    mode::create_world::CreateWorldSubcmdResponse,
    response::ResponseEnvelope,
  },
  world::{
    GenerationStepKind,
    WorldDescriptorInput,
    WorldDescriptorValidation,
    WorldDimsInput,
    WorldDimsValidation,
  },
};
use super::CreateWorldSubcmdEnvelope;

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct TakeGenerationStepCmd{
  pub(crate) kind: GenerationStepKind,
}

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) enum TakeGenerationStepRsp {
  Ok {},
  Failed(Vec<String>),
}
impl Command for TakeGenerationStepCmd {
  type Response = TakeGenerationStepRsp;
  fn name() -> &'static str {
    "TakeGenerationStep"
  }
  fn description() -> &'static str {
    "Take the given step in world generation."
  }
  fn to_queue_command(&self) -> CommandEnvelope {
    CommandEnvelope::CreateWorldSubcmd(
      CreateWorldSubcmdEnvelope::TakeGenerationStep(self.clone())
    )
  }
  fn embed_response(response: Self::Response) -> ResponseEnvelope {
    let subcmd_response = match response {
      TakeGenerationStepRsp::Ok {} =>
        CreateWorldSubcmdResponse::Ok {},
      TakeGenerationStepRsp::Failed(errors) =>
        CreateWorldSubcmdResponse::Failed(errors),
    };
    ResponseEnvelope::CreateWorldSubcmd(subcmd_response)
  }

  fn protocol_examples() -> (Vec<Self>, Vec<Self::Response>) {
    let take_generation_step_example =
      TakeGenerationStepCmd { kind: GenerationStepKind::InitializeCell };

    let take_generation_step_ok_response_example =
      TakeGenerationStepRsp::Ok {};
    
    let take_generation_step_err_response_example =
      TakeGenerationStepRsp::Failed(vec![
        "Wrong step kind for current generation point".to_string(),
      ]);

    (
      vec![take_generation_step_example],
      vec![
        take_generation_step_ok_response_example,
        take_generation_step_err_response_example,
      ]
    )
  }
  fn protocol_notes() -> Vec<String> {
    vec![
      "Possible step kinds are:".to_string(),
      "  - RandGen - newly created => pre-initialize".to_string(),
      "  - InitializeCell - pre-initialize => cell-initialized".to_string(),
      "  - PairwiseStep - cell-initialized => pre-merge".to_string(),
      "  - PairwiseMerge - pre-merge => cell-initialized".to_string(),
      "  - Finalize - cell-initialized => final".to_string(),
    ]
  }
}
