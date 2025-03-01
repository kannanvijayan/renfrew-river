mod subcommand;
mod response;
mod documentation;

mod begin_new_world_cmd;

pub(crate) use self::{
  subcommand::CreateWorldSubcmdEnvelope,
  response::CreateWorldSubcmdResponse,
  documentation::get_category_docs,
};

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct CreateWorldModeInfo {}
