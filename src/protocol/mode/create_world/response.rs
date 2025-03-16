use crate::world::{
  WorldDescriptor,
  WorldDescriptorInput,
  WorldDescriptorValidation,
};
use super::{
  current_descriptor_input_cmd::CurrentDescriptorInputRsp,
  current_generation_phase_cmd::CurrentGenerationPhaseRsp,
  get_map_data_cmd::GetMapDataRsp,
  get_minimap_data_cmd::GetMinimapDataRsp,
};

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) enum CreateWorldSubcmdResponse {
  Ok {},
  BeganNewWorld(WorldDescriptorInput),
  ValidWorldDescriptor(WorldDescriptor),
  InvalidWorldDescriptor(WorldDescriptorValidation),
  CurrentDescriptorInput(CurrentDescriptorInputRsp),
  Failed(Vec<String>),
  CurrentGenerationPhase(CurrentGenerationPhaseRsp),
  MapData(GetMapDataRsp),
  MinimapData(GetMinimapDataRsp),
}
