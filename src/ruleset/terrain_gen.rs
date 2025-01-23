use crate::gpu::shady_vm::{ ShasmProgram, ShadyRegister };
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
  #[serde(rename = "initProgram")]
  pub(crate) init_program: ShasmProgram,

  // Number of iterations to run pairwise/merge programs.
  pub(crate) iterations: u32,

  // The pairwise tile processing program.
  #[serde(rename = "pairwiseProgram")]
  pub(crate) pairwise_program: ShasmProgram,
  // The number of output registers from the pairwise program.
  #[serde(rename = "pairwiseOutputRegisters")]
  pub(crate) pairwise_output_registers: u32,

  // The merge processing program.
  #[serde(rename = "mergeProgram")]
  pub(crate) merge_program: ShasmProgram,

  // The final tile processing program.
  // This should take an input in this stage's format, and emit an output in
  // next stage's format.
  #[serde(rename = "finalProgram")]
  pub(crate) final_program: ShasmProgram,
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
