mod format;
mod terrain_gen;

pub(crate) use self::{
  format::{
    FormatRules,
    FormatInput,
    FormatValidation,
    FormatWordRules,
    FormatWordInput,
    FormatWordValidation,
    FormatComponentRules,
    FormatComponentInput,
    FormatComponentValidation,
  },
  terrain_gen::{
    TerrainGenRules,
    TerrainGenInput,
    TerrainGenValidation,
    TerrainGenStageRules,
    TerrainGenStageInput,
    TerrainGenStageValidation,
    TerrainGenPerlinRules,
    TerrainGenPerlinInput,
    TerrainGenPerlinValidation,
  },
};

use crate::data_store::DataStore;

/**
 * The entry in a directory of rulesets.
 */
#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct RulesetEntry {
  pub(crate) name: String,
  pub(crate) description: String,
}

/**
 * The ruleset for a game.
 * 
 * This includes all the schema data describing the data formats
 * of various types, programs for behaviours, and other information.
 */
#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct Ruleset {
  // The name of the ruleset.
  pub(crate) name: String,

  // The description of the ruleset.
  pub(crate) description: String,

  // The terrain generator definition.
  #[serde(rename = "terrainGen")]
  pub(crate) terrain_gen: TerrainGenRules,
}
impl Ruleset {
  pub(crate) fn entry(&self) -> RulesetEntry {
    RulesetEntry {
      name: self.name.clone(),
      description: self.description.clone(),
    }
  }
}

/**
 * The input for a ruleset.
 */
#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct RulesetInput {
  pub(crate) name: String,
  pub(crate) description: String,

  #[serde(rename = "terrainGen")]
  pub(crate) terrain_gen: TerrainGenInput,
}
impl RulesetInput {
  const MAX_DESCRIPTION_LENGTH: usize = 100;

  pub(crate) fn to_validated(&self, store: &DataStore)
    -> Result<Ruleset, RulesetValidation>
  {
    let errors = Vec::new();
    let mut name_errors = Vec::new();
    let mut description_errors = Vec::new();

    self.validate_name(&mut name_errors);
    self.validate_description(&mut description_errors);

    if store.rulesets().list().iter().any(|entry| entry.name == self.name) {
      name_errors.push("A ruleset with this name already exists.".to_string());
    }

    let maybe_terrain_gen = self.terrain_gen.to_validated();
    if name_errors.is_empty() && description_errors.is_empty() && maybe_terrain_gen.is_ok() {
      Ok(Ruleset {
        name: self.name.clone(),
        description: self.description.clone(),
        terrain_gen: maybe_terrain_gen.unwrap(),
      })
    } else {
      Err(RulesetValidation {
        errors,
        name: name_errors,
        description: description_errors,
        terrain_gen: maybe_terrain_gen.err(),
      })
    }
  }

  fn validate_name(&self, name_errors: &mut Vec<String>) {
    if self.name.is_empty() {
      name_errors.push("The name is required.".to_string());
    }
  }

  fn validate_description(&self, descr_errors: &mut Vec<String>) {
    if self.description.len() > Self::MAX_DESCRIPTION_LENGTH {
      descr_errors.push("The description is too long.".to_string());
    }
  }
}

/**
 * The validation of a ruleset.
 */
#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct RulesetValidation {
  pub(crate) errors: Vec<String>,

  pub(crate) name: Vec<String>,
  pub(crate) description: Vec<String>,

  #[serde(rename = "terrainGen")]
  #[serde(skip_serializing_if = "Option::is_none")]
  pub(crate) terrain_gen: Option<TerrainGenValidation>,
}
impl RulesetValidation {
  pub(crate) fn new_valid() -> Self {
    RulesetValidation {
      errors: Vec::new(),
      name: Vec::new(),
      description: Vec::new(),
      terrain_gen: None,
    }
  }

  pub(crate) fn is_valid(&self) -> bool {
    self.errors.is_empty()
      && self.terrain_gen.as_ref().map_or(true, |tgv| tgv.is_valid())
  }
}
