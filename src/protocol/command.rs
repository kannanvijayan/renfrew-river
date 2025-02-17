use serde;
use serde_json;
use super::{
  response::ResponseEnvelope,
  documentation::ProtocolCommandDocumentation,
  mode::define_rules::command::DefineRulesSubcmdEnvelope,
};

/** Base trait implemented by all commands. */
pub(crate) trait Command:
  Sized +
  serde::Serialize +
  serde::de::DeserializeOwned +
  std::fmt::Debug
{
  type Response: for <'x> serde::Deserialize<'x> + serde::Serialize;
  fn name() -> &'static str;
  fn description() -> &'static str;
  fn to_queue_command(&self) -> CommandEnvelope;
  fn extract_response(response: &ResponseEnvelope) -> Option<Self::Response>;
  fn embed_response(response: Self::Response) -> ResponseEnvelope;
  fn validate(&self, _errors: &mut Vec<String>) -> bool {
    true
  }

  // Get a list of examples of commands and responses, as json values.
  fn protocol_examples() -> (Vec<Self>, Vec<Self::Response>);
  fn protocol_notes() -> Vec<String> {
    Vec::new()
  }
}

pub(crate) fn make_command_example<C: Command>()
  -> ProtocolCommandDocumentation
{
  let (commands, responses) = C::protocol_examples();
  let notes = C::protocol_notes();
  let command_examples: Vec<String> = commands.into_iter().map(|command| {
    serde_json::to_string_pretty(&command.to_queue_command()).unwrap()
  }).collect();
  let response_examples: Vec<String> = responses.into_iter().map(|response| {
    serde_json::to_string_pretty(&C::embed_response(response)).unwrap()
  }).collect();
  return ProtocolCommandDocumentation {
    name: C::name().to_string(),
    description: C::description().to_string(),
    notes,
    command_examples,
    response_examples,
  }
}

/** Tagged union type for commands sent over transport channels. */
#[derive(Debug)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) enum CommandEnvelope {
  DefineRulesSubcmd(Box<DefineRulesSubcmdEnvelope>),
}
