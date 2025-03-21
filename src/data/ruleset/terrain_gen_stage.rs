use crate::shady_vm::{ ShasmProgram, ShasmProgramValidation };
use super::{
  FormatInput,
  FormatRules,
  FormatValidation,
};

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct TerrainGenStageRules {
  // The format of the terrain data at this stage.
  pub(crate) format: FormatRules,

  // The program to use to initialize the pass.
  #[serde(rename = "initProgram")]
  pub(crate) init_program: ShasmProgram,

  // The pairwise tile processing program.
  #[serde(rename = "pairwiseProgram")]
  pub(crate) pairwise_program: ShasmProgram,

  // The merge processing program.
  #[serde(rename = "mergeProgram")]
  pub(crate) merge_program: ShasmProgram,

  // The final tile processing program.
  // This should take an input in this stage's format, and emit an output in
  // next stage's format.
  #[serde(rename = "finalProgram")]
  pub(crate) final_program: ShasmProgram,
}
impl TerrainGenStageRules {
  pub(crate) fn to_input(&self) -> TerrainGenStageInput {
    TerrainGenStageInput {
      format: self.format.to_input(),
      init_program: self.init_program.program_text.clone(),
      pairwise_program: self.pairwise_program.program_text.clone(),
      merge_program: self.merge_program.program_text.to_string(),
      final_program: self.final_program.program_text.to_string(),
    }
  }
}

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct TerrainGenStageInput {
  pub(crate) format: FormatInput,

  #[serde(rename = "initProgram")]
  pub(crate) init_program: String,

  #[serde(rename = "pairwiseProgram")]
  pub(crate) pairwise_program: String,

  #[serde(rename = "mergeProgram")]
  pub(crate) merge_program: String,

  #[serde(rename = "finalProgram")]
  pub(crate) final_program: String,
}
impl TerrainGenStageInput {
  pub(crate) fn new() -> Self {
    TerrainGenStageInput {
      format: FormatInput::new(),
      init_program: "".to_string(),
      pairwise_program: "".to_string(),
      merge_program: "".to_string(),
      final_program: "".to_string(),
    }
  }

  pub(crate) fn to_validated(&self) -> Result<TerrainGenStageRules, TerrainGenStageValidation> {
    let maybe_format = self.format.to_validated();
    let maybe_init_program = ShasmProgram::to_validated(&self.init_program);
    let maybe_pairwise_program = ShasmProgram::to_validated(&self.pairwise_program);
    let maybe_merge_program = ShasmProgram::to_validated(&self.merge_program);
    let maybe_final_program = ShasmProgram::to_validated(&self.final_program);

    if maybe_format.is_err() ||
       maybe_init_program.is_err() ||
        maybe_pairwise_program.is_err() ||
        maybe_merge_program.is_err() ||
        maybe_final_program.is_err() {
      let mut validation = TerrainGenStageValidation::new();
      validation.format = maybe_format.err();
      validation.init_program = maybe_init_program.err();
      validation.pairwise_program = maybe_pairwise_program.err();
      validation.merge_program = maybe_merge_program.err();
      validation.final_program = maybe_final_program.err();
      Err(validation)
    } else {
      Ok(TerrainGenStageRules {
        format: maybe_format.unwrap(),
        init_program: maybe_init_program.unwrap(),
        pairwise_program: maybe_pairwise_program.unwrap(),
        merge_program: maybe_merge_program.unwrap(),
        final_program: maybe_final_program.unwrap(),
      })
    }

  }
}

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct TerrainGenStageValidation {
  pub(crate) errors: Vec<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub(crate) format: Option<FormatValidation>,

  #[serde(rename = "initProgram")]
  #[serde(skip_serializing_if = "Option::is_none")]
  pub(crate) init_program: Option<ShasmProgramValidation>,

  #[serde(rename = "pairwiseProgram")]
  #[serde(skip_serializing_if = "Option::is_none")]
  pub(crate) pairwise_program: Option<ShasmProgramValidation>,

  #[serde(rename = "mergeProgram")]
  #[serde(skip_serializing_if = "Option::is_none")]
  pub(crate) merge_program: Option<ShasmProgramValidation>,

  #[serde(rename = "finalProgram")]
  #[serde(skip_serializing_if = "Option::is_none")]
  pub(crate) final_program: Option<ShasmProgramValidation>,
}
impl TerrainGenStageValidation {
  pub(crate) fn new() -> Self {
    TerrainGenStageValidation {
      errors: Vec::new(),
      format: None,
      init_program: None,
      pairwise_program: None,
      merge_program: None,
      final_program: None,
    }
  }

  pub(crate) fn is_valid(&self) -> bool {
    self.errors.is_empty()
      && self.format.as_ref().map_or(true, |fv| fv.is_valid())
      && self.init_program.as_ref().map_or(true, |ipv| ipv.is_valid())
      && self.pairwise_program.as_ref().map_or(true, |ppv| ppv.is_valid())
      && self.merge_program.as_ref().map_or(true, |mpv| mpv.is_valid())
      && self.final_program.as_ref().map_or(true, |fpv| fpv.is_valid())
  }
}
