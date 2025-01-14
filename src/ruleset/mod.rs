mod format;
mod terrain_gen;

pub(crate) use self::{
  format::{ FormatRules, FormatRulesWord, FormatRulesComponent },
  terrain_gen::{ TerrainGenRules, TerrainGenStageRules, TerrainGenPerlinRules },
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
  // The terrain generator definition.
  pub(crate) terrain_gen: TerrainGenRules,
}
