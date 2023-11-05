use serde_json;

use crate::game::command::{
  Command,
  DefaultSettingsCmd,
  HasGameCmd,
  NewGameCmd,
  StopGameCmd,
  ReadMapDataCmd,
  MiniElevationsCmd,
  ReadAnimalsCmd,
  TakeTurnStepCmd,
};

pub struct ProtocolDocumentation {
  pub name: String,
  pub description: String,
  pub notes: Vec<String>,
  pub command_examples: Vec<String>,
  pub response_examples: Vec<String>,
}

/**
 * Get a list of examples of commands and responses, as json values.
 */
pub fn get_protocol_docs() -> Vec<ProtocolDocumentation> {
  let mut result = Vec::new();
  result.push(make_example::<HasGameCmd>());
  result.push(make_example::<DefaultSettingsCmd>());
  result.push(make_example::<NewGameCmd>());
  result.push(make_example::<StopGameCmd>());
  result.push(make_example::<ReadMapDataCmd>());
  result.push(make_example::<MiniElevationsCmd>());
  result.push(make_example::<ReadAnimalsCmd>());
  result.push(make_example::<TakeTurnStepCmd>());
  return result;
}

fn make_example<C: Command>() -> ProtocolDocumentation {
  let (commands, responses) = C::protocol_examples();
  let notes = C::protocol_notes();
  let command_examples: Vec<String> = commands.into_iter().map(|command| {
    serde_json::to_string_pretty(&command.to_queue_command()).unwrap()
  }).collect();
  let response_examples: Vec<String> = responses.into_iter().map(|response| {
    serde_json::to_string_pretty(&C::embed_response(response)).unwrap()
  }).collect();
  return ProtocolDocumentation {
    name: C::name().to_string(),
    description: C::description().to_string(),
    notes,
    command_examples,
    response_examples,
  }
}
