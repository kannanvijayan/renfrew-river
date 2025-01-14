pub(crate) mod command;
pub(crate) mod response;


use self::{
  command::CreateWorldSubcmdEnvelope,
  response::CreateWorldSubcmdResponse,
};

pub(crate) struct CreateWorldMode {
  name: String,
  description: String,
}
impl CreateWorldMode {
  pub(crate) fn new(name: String, description: String) -> Self {
    CreateWorldMode { name, description }
  }

  pub(crate) fn handle_subcommand(&mut self, subcmd: CreateWorldSubcmdEnvelope)
    -> CreateWorldSubcmdResponse
  {
    panic!("TODO: Implement.")
  }
}
