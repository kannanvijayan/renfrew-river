use crate::ProtocolCategoryDocumentation;

pub fn get_category_docs() -> ProtocolCategoryDocumentation {
  let mut commands = Vec::new();

  ProtocolCategoryDocumentation {
    name: "Create World".to_string(),
    description: "Commands for creating new game worlds.".to_string(),
    commands,
  }
}
