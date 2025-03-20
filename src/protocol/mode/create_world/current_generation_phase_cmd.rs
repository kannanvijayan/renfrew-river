use serde;
use crate::{
  protocol::{
    command::{ Command, CommandEnvelope },
    mode::create_world::CreateWorldSubcmdResponse,
    response::ResponseEnvelope,
  },
  data::GenerationPhase,
};
use super::CreateWorldSubcmdEnvelope;

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct CurrentGenerationPhaseCmd {}

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct CurrentGenerationPhaseRsp {
  pub(crate) phase: GenerationPhase,
}
impl Command for CurrentGenerationPhaseCmd {
  type Response = CurrentGenerationPhaseRsp;
  fn name() -> &'static str {
    "GetGenerationPhase"
  }
  fn description() -> &'static str {
    "Get the current world generation phase."
  }
  fn to_queue_command(&self) -> CommandEnvelope {
    CommandEnvelope::CreateWorldSubcmd(
      CreateWorldSubcmdEnvelope::CurrentGenerationPhase(self.clone())
    )
  }
  fn embed_response(response: Self::Response) -> ResponseEnvelope {
    ResponseEnvelope::CreateWorldSubcmd(
      CreateWorldSubcmdResponse::CurrentGenerationPhase(response)
    )
  }

  fn protocol_examples() -> (Vec<Self>, Vec<Self::Response>) {
    let current_generation_phase_example = CurrentGenerationPhaseCmd {};

    let current_generation_phase_response_example = CurrentGenerationPhaseRsp {
      phase: GenerationPhase::PreInitialize,
    };
    (
      vec![current_generation_phase_example],
      vec![current_generation_phase_response_example],
    )
  }
  fn protocol_notes() -> Vec<String> {
    vec![]
  }
}
