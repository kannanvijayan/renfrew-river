pub(crate) mod command;
pub(crate) mod response;
pub(crate) mod protocol_documentation;


use self::{
  command::DefineRulesSubcmdEnvelope,
  response::DefineRulesSubcmdResponse,
};

pub(crate) struct DefineRulesMode {
  name: String,
  description: String,
}
impl DefineRulesMode {
  pub(crate) fn new(name: String, description: String) -> Self {
    DefineRulesMode { name, description }
  }

  pub(crate) fn handle_subcommand(&mut self, subcmd: DefineRulesSubcmdEnvelope)
    -> DefineRulesSubcmdResponse
  {
    panic!("TODO: Implement.")
  }
}
