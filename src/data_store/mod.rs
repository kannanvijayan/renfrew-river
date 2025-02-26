
mod file_manager;
mod ruleset_store;

pub(crate) use self::{
  file_manager::{ FileManager, FileManagerSubtree },
  ruleset_store::{ RulesetStore, RulesetStoreEntry },
};

use std::path::Path;

pub(crate) struct DataStore {
  file_manager: FileManager,
}
impl DataStore {
  pub(crate) fn new(root_path: &Path) -> Self {
    let file_manager = FileManager::new(root_path);
    Self { file_manager }
  }

  pub(crate) fn rulesets(&self) -> RulesetStore {
    RulesetStore::new(self.file_manager.root().subdir("rulesets"))
  }
}
