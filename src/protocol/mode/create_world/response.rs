use crate::world::{WorldDescriptorInput, WorldDescriptorValidation};
use super::{
  current_descriptor_input_cmd::CurrentDescriptorInputRsp,
  current_generation_phase_cmd::CurrentGenerationPhaseRsp,
};

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) enum CreateWorldSubcmdResponse {
  Ok {},
  BeganNewWorld(WorldDescriptorInput),
  InvalidWorldDescriptor(WorldDescriptorValidation),
  CurrentDescriptorInput(CurrentDescriptorInputRsp),
  Failed(Vec<String>),
  CurrentGenerationPhase(CurrentGenerationPhaseRsp),
}
