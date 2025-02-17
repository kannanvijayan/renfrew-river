use crate::{
  game::command::make_command_example,
  ProtocolCategoryDocumentation,
};
use super::command::ValidateRulesCmd;

pub fn get_category_docs() -> ProtocolCategoryDocumentation {
  let mut commands = Vec::new();
  commands.push(make_command_example::<ValidateRulesCmd>());

  ProtocolCategoryDocumentation {
    name: "Define Rules".to_string(),
    description: "Commands for creating and manipulating rulesets".to_string(),
    commands,
  }
}
