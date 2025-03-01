
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

  pub(crate) fn new(subtree: FileManagerSubtree, is_new: bool) -> Self {
    let ruleset_json = {
      if is_new {
        subtree.write(Self::INDEX_FILENAME, "[]")
          .expect("Failed to write ruleset index file");
        "[]".to_string()
      } else {
        subtree.read(Self::INDEX_FILENAME)
          .expect("Failed to read ruleset index file")
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

  fn find_entry(&self, name: &str) -> Option<&RulesetStoreEntry> {
    self.entries.iter().find(|entry| entry.name == name)
  }

  pub(crate) fn read(&self, name: &str) -> Ruleset {
    let entry = self.find_entry(name)
      .expect(format!("Failed to find ruleset entry: {}", name).as_str());
    let ruleset_str = self.subtree.read(&entry.filename)
      .expect(format!("Failed to read ruleset file: {}", &entry.filename).as_str());
    serde_json::from_str(&ruleset_str)
      .expect(format!("Failed to parse ruleset JSON: {}", name).as_str())
  }

  pub(crate) fn write(&mut self, name: &str, ruleset: &Ruleset) {
    let existing_entry = self.find_entry(name);
    let filename = if let Some(entry) = existing_entry {
      entry.filename.clone()
    } else {
      format!("rls{}_{}.json", self.entries.len(), name)
    };

    let ruleset_str = serde_json::to_string(ruleset)
      .expect("Failed to serialize ruleset to JSON");
    self.subtree.write(&filename, &ruleset_str)
      .expect(format!("Failed to write ruleset file: {}", &filename).as_str());

    if existing_entry.is_none() {
      self.entries.push(RulesetStoreEntry {
        name: ruleset.name.clone(),
        description: ruleset.description.clone(),
        filename,
      });
    }

    let index_str = serde_json::to_string(&self.entries)
      .expect("Failed to serialize ruleset index to JSON");
    self.subtree.write(Self::INDEX_FILENAME, &index_str)
      .expect("Failed to write ruleset index file");
  }

  pub(crate) fn delete(&mut self, name: &str) {
    let entry = self.find_entry(name)
      .expect(format!("Failed to find ruleset entry: {}", name).as_str());
    self.subtree.delete(&entry.filename)
      .expect(format!("Failed to delete ruleset file: {}", &entry.filename).as_str());
    self.entries.retain(|entry| entry.name != name);

    let index_str = serde_json::to_string(&self.entries)
      .expect("Failed to serialize ruleset index to JSON");
    self.subtree.write(Self::INDEX_FILENAME, &index_str)
      .expect("Failed to write ruleset index file");
  }
}
