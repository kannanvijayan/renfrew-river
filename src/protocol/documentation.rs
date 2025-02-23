use serde_json;
use super::{
  command::Command,
  mode::define_rules,
};

pub struct ProtocolCommandDocumentation {
  pub name: String,
  pub description: String,
  pub notes: Vec<String>,
  pub command_examples: Vec<String>,
  pub response_examples: Vec<String>,
}

pub struct ProtocolCategoryDocumentation {
  pub name: String,
  pub description: String,
  pub commands: Vec<ProtocolCommandDocumentation>,
}

/**
 * Get a list of examples of commands and responses, as json values.
 */
pub fn get_protocol_docs() -> Vec<ProtocolCategoryDocumentation> {
  let mut result = Vec::new();
  result.push(define_rules::get_category_docs());
  return result;
}

fn make_example<C: Command>() -> ProtocolCommandDocumentation {
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
