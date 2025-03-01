mod subcommand;
mod response;
mod documentation;

mod update_descriptor_input_cmd;
mod current_descriptor_input_cmd;
mod begin_generation_cmd;

pub(crate) use self::{
  subcommand::CreateWorldSubcmdEnvelope,
  response::CreateWorldSubcmdResponse,
  documentation::get_category_docs,

  update_descriptor_input_cmd::{
    UpdateDescriptorInputCmd,
    UpdateDescriptorInputRsp,
  },
  current_descriptor_input_cmd::{
    CurrentDescriptorInputCmd,
    CurrentDescriptorInputRsp,
  },
  begin_generation_cmd::{
    BeginGenerationCmd,
    BeginGenerationRsp,
  },
};

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct CreateWorldModeInfo {}
