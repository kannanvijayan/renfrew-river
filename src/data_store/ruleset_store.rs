
use super::FileManagerSubtree;

use crate::ruleset::{ Ruleset, RulesetEntry };

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct RulesetStoreEntry {
  pub(crate) name: String,
  pub(crate) description: String,
  pub(crate) filename: String,
}
impl RulesetStoreEntry {
  pub(crate) fn into_ruleset_entry(self) -> RulesetEntry {
    RulesetEntry {
      name: self.name,
      description: self.description,
    }
  }
}

pub(crate) struct RulesetStore {
  subtree: FileManagerSubtree,
  entries: Vec<RulesetStoreEntry>,
}
impl RulesetStore {
  const INDEX_FILENAME: &'static str = "rulesets.json";

  pub(crate) fn new(subtree: FileManagerSubtree) -> Self {
    let ruleset_json = match subtree.read(Self::INDEX_FILENAME) {
      Ok(json) => json,
      Err(_) => {
        log::warn!("Failed to read ruleset index file, using empty one.");
        "[]".to_string()
      }
    };
    let entries: Vec<RulesetStoreEntry> =
      serde_json::from_str(&ruleset_json).expect("Failed to parse index.json");

    Self { subtree, entries }
  }

  pub(crate) fn list(&self) -> Vec<RulesetStoreEntry> {
    // Read and parse the index file.
    self.entries.clone()
  }

  pub(crate) fn read(&self, name: &str) -> Ruleset {
    let ruleset_str = self.subtree.read(name)
      .expect(format!("Failed to read ruleset file: {}", name).as_str());
    serde_json::from_str(&ruleset_str)
      .expect(format!("Failed to parse ruleset JSON: {}", name).as_str())
  }

  pub(crate) fn write(&mut self, name: &str, ruleset: &Ruleset) {
    let ruleset_str = serde_json::to_string(ruleset)
      .expect("Failed to serialize ruleset to JSON");
    let filename = format!("rls{}_{}.json", self.entries.len(), name);
    self.subtree.write(name, &ruleset_str)
      .expect(format!("Failed to write ruleset file: {}", name).as_str());

    let entry = RulesetStoreEntry {
      name: ruleset.name.clone(),
      description: ruleset.description.clone(),
      filename,
    };
    self.entries.push(entry);

    let index_str = serde_json::to_string(&self.entries)
      .expect("Failed to serialize ruleset index to JSON");
    self.subtree.write(Self::INDEX_FILENAME, &index_str)
      .expect("Failed to write ruleset index file");
  }
}
