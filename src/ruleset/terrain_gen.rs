use crate::gpu::{ ShadyProgram, ShadyRegister };
use super::FormatRules;

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct TerrainGenRules {
  // The terrain generation starts with some number of optional perlin passes
  // to initialize one or more registers of the terrain generator VM.
  pub(crate) perlin: TerrainGenPerlinRules,

  // The definition of each terrain generator pass.
  pub(crate) stage: TerrainGenStageRules,
}

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct TerrainGenStageRules {
  // The format of the terrain data at this stage.
  pub(crate) format: FormatRules,

  // The program to use to initialize the pass.
  pub(crate) init_program: ShadyProgram,

  // Number of iterations to run pairwise/merge programs.
  pub(crate) iterations: u32,

  // The pairwise tile processing program.
  pub(crate) pairwise_program: ShadyProgram,
  // The number of output registers from the pairwise program.
  pub(crate) pairwise_output_registers: u32,

  // The merge processing program.
  pub(crate) merge_program: ShadyProgram,

  // The final tile processing program.
  // This should take an input in this stage's format, and emit an output in
  // next stage's format.
  pub(crate) final_program: ShadyProgram,
}

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct TerrainGenPerlinRules {
  // The perlin parameters.
  pub(crate) seed: u64,
  pub(crate) octaves: u8,
  pub(crate) frequency: u8,
  pub(crate) amplitude: u8,

  // The register to store the result in.
  pub(crate) register: ShadyRegister,
}
