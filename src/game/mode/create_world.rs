
use crate::{
  data_store::DataStore,
  protocol::mode::create_world::{
    CreateWorldSubcmdEnvelope,
    CreateWorldSubcmdResponse,
  },
};

pub(crate) struct CreateWorldMode {
}
impl CreateWorldMode {
  pub(crate) fn new() -> Self {
    CreateWorldMode {}
  }

  pub(crate) fn handle_subcommand(&mut self,
    subcmd: CreateWorldSubcmdEnvelope,
    _data_store: &mut DataStore
  ) -> CreateWorldSubcmdResponse {
    match subcmd {
      CreateWorldSubcmdEnvelope::BeginNewWorld(_begin_new_world_cmd) => {
        log::debug!("CreateWorldMode::handle_subcommand: BeginNewWorld");
        CreateWorldSubcmdResponse::Ok {}
      }
    }
  }
}
