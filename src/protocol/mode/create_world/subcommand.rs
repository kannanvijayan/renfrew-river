use super::{
  update_descriptor_input_cmd::UpdateDescriptorInputCmd,
  current_descriptor_input_cmd::CurrentDescriptorInputCmd,
  begin_generation_cmd::BeginGenerationCmd,
  take_generation_step_cmd::TakeGenerationStepCmd,
  current_generation_phase_cmd::CurrentGenerationPhaseCmd,
  get_map_data_cmd::GetMapDataCmd,
  get_minimap_data_cmd::GetMinimapDataCmd,
};

#[derive(Debug)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) enum CreateWorldSubcmdEnvelope {
  CurrentDescriptorInput(CurrentDescriptorInputCmd),
  UpdateDescriptorInput(UpdateDescriptorInputCmd),
  BeginGeneration(BeginGenerationCmd),
  TakeGenerationStep(TakeGenerationStepCmd),
  CurrentGenerationPhase(CurrentGenerationPhaseCmd),
  GetMapData(GetMapDataCmd),
  GetMinimapData(GetMinimapDataCmd),
}
