use crate::world::{WorldDescriptorInput, WorldDescriptorValidation};
use super::current_descriptor_input_cmd::CurrentDescriptorInputRsp;

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) enum CreateWorldSubcmdResponse {
  Ok {},
  BeganNewWorld(WorldDescriptorInput),
  InvalidWorldDescriptor(WorldDescriptorValidation),
  CurrentDescriptorInput(CurrentDescriptorInputRsp),
  Failed(Vec<String>),
}
