use crate::{
  protocol::command::make_command_example,
  ProtocolCategoryDocumentation,
};
use super::{
  save_rules_cmd::SaveRulesCmd,
  update_rules_cmd::UpdateRulesCmd,
};

pub fn get_category_docs() -> ProtocolCategoryDocumentation {
  let mut commands = Vec::new();
  commands.push(make_command_example::<UpdateRulesCmd>());
  commands.push(make_command_example::<SaveRulesCmd>());

  ProtocolCategoryDocumentation {
    name: "Define Rules".to_string(),
    description: "Commands for creating and manipulating rulesets".to_string(),
    commands,
  }
}
