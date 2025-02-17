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
  pub(crate) fn validate(&self) -> RulesetValidation {
    let mut errors = Vec::new();
    let mut name_errors = Vec::new();
    let mut description_errors = Vec::new();

    self.validate_name(&mut name_errors);
    self.validate_description(&mut description_errors);

    let terrain_gen = self.terrain_gen.validate();
    if !terrain_gen.errors.is_empty() {
      errors.push("Terrain generator has errors.".to_string());
    }

    RulesetValidation {
      errors,
      name: name_errors,
      description: description_errors,
      terrain_gen: Some(terrain_gen),
    }
  }

  fn validate_name(&self, errors: &mut Vec<String>) {
    if self.name.is_empty() {
      errors.push("The name is required.".to_string());
    }
  }

  fn validate_description(&self, _errors: &mut Vec<String>) {
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
  pub(crate) fn is_valid(&self) -> bool {
    self.errors.is_empty()
      && self.terrain_gen.as_ref().map_or(true, |tgv| tgv.is_valid())
  }
}
