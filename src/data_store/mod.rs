mod file_manager;
mod ruleset_store;

pub(crate) use self::{
  file_manager::{ FileManager, FileManagerSubtree },
  ruleset_store::{ RulesetStore, RulesetStoreEntry },
};

use std::{ path::Path, fs };

pub(crate) struct DataStore {
  file_manager: FileManager,
}
impl DataStore {
  pub(crate) fn new(root_path: &Path) -> Self {
    log::info!("DataStore::new: root_path={:?}", root_path);
    // If root path doesn't exist, create it.
    Self::ensure_dir(root_path);

    let file_manager = FileManager::new(root_path);
    Self { file_manager }
  }

  pub(crate) fn rulesets(&self) -> RulesetStore {
    let subtree = self.file_manager.root().subdir("rulesets");
    let is_new = Self::ensure_dir(subtree.path());
    RulesetStore::new(subtree, is_new)
  }

  fn ensure_dir(path: &Path) -> bool {
    if !path.exists() {
      fs::create_dir_all(path).expect("Failed to create directory");
      true
    } else {
      false
    }
  }
}
