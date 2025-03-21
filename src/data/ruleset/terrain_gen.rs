use crate::shady_vm::{ ShadyRegister, ShasmProgram };
use super::{
  terrain_gen_randgen::{
    TerrainGenPerlinRules,
    TerrainGenPerlinInput,
    TerrainGenPerlinValidation,
  },
  terrain_gen_stage::{
    TerrainGenStageRules,
    TerrainGenStageInput,
    TerrainGenStageValidation,
  },
  FormatRules
};


#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct TerrainGenRules {
  // The terrain generation starts with some number of optional perlin passes
  // to initialize one or more registers of the terrain generator VM.
  pub(crate) perlin: TerrainGenPerlinRules,

  // The definition of each terrain generator pass.
  pub(crate) stage: TerrainGenStageRules,
}
impl TerrainGenRules {
  pub(crate) fn to_input(&self) -> TerrainGenInput {
    TerrainGenInput {
      perlin: self.perlin.to_input(),
      stage: self.stage.to_input(),
    }
  }
}
impl TerrainGenRules {
  pub(crate) fn new_example() -> Self {
    TerrainGenRules {
      perlin: TerrainGenPerlinRules {
        register: ShadyRegister::new(92),
      },
      stage: TerrainGenStageRules {
        format: FormatRules::new_example(),
        init_program: ShasmProgram::new_example(),
        pairwise_program: ShasmProgram::new_example(),
        merge_program: ShasmProgram::new_example(),
        final_program: ShasmProgram::new_example(),
      },
    }
  }
}

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct TerrainGenInput {
  pub(crate) perlin: TerrainGenPerlinInput,
  pub(crate) stage: TerrainGenStageInput,
}
impl TerrainGenInput {
  pub(crate) fn new() -> Self {
    TerrainGenInput {
      perlin: TerrainGenPerlinInput::new(),
      stage: TerrainGenStageInput::new(),
    }
  }

  pub(crate) fn to_validated(&self) -> Result<TerrainGenRules, TerrainGenValidation> {
    let perlin = self.perlin.to_validated();
    let stage = self.stage.to_validated();
    if perlin.is_ok() && stage.is_ok() {
      Ok(TerrainGenRules {
        perlin: perlin.unwrap(),
        stage: stage.unwrap()
      })
    } else {
      Err(TerrainGenValidation {
        errors: vec!["The terrain generator is invalid.".to_string()],
        perlin: perlin.err(),
        stage: stage.err(),
      })
    }
  }
}

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct TerrainGenValidation {
  pub(crate) errors: Vec<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub(crate) perlin: Option<TerrainGenPerlinValidation>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub(crate) stage: Option<TerrainGenStageValidation>,
}
impl TerrainGenValidation {
  pub(crate) fn new() -> Self {
    TerrainGenValidation {
      errors: Vec::new(),
      perlin: None,
      stage: None,
    }
  }

  pub(crate) fn is_valid(&self) -> bool {
    self.errors.is_empty()
      && self.perlin.as_ref().map_or(true, |pv| pv.is_valid())
      && self.stage.as_ref().map_or(true, |sv| sv.is_valid())
  }
}
