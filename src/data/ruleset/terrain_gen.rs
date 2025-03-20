use crate::shady_vm::{ ShadyRegister, ShasmProgram, ShasmProgramValidation };
use super::{ FormatInput, FormatRules, FormatValidation };

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

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct TerrainGenPerlinRules {
  // The register to store the result in.
  pub(crate) register: ShadyRegister,
}
impl TerrainGenPerlinRules {
  pub(crate) fn to_input(&self) -> TerrainGenPerlinInput {
    let register = format!("{}", self.register.to_u8());
    TerrainGenPerlinInput { register }
  }
}

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct TerrainGenPerlinInput {
  pub(crate) register: String,
}
impl TerrainGenPerlinInput {
  pub(crate) fn new() -> Self {
    TerrainGenPerlinInput {
      register: "".to_string(),
    }
  }

  pub(crate) fn to_validated(&self) -> Result<TerrainGenPerlinRules, TerrainGenPerlinValidation> {
    let mut validation = TerrainGenPerlinValidation::new();
    let maybe_register = self.validate_register(&mut validation);
    if maybe_register.is_none() {
      Err(validation)
    } else {
      Ok(TerrainGenPerlinRules {
        register: maybe_register.unwrap(),
      })
    }
      
  }

  fn validate_register(&self, validation: &mut TerrainGenPerlinValidation) -> Option<ShadyRegister> {
    if self.register.is_empty() {
      validation.errors.push("The `register` value is required.".to_string());
    }
    let maybe_register = self.register.parse::<u8>();
    match maybe_register {
      Ok(_) => Some(ShadyRegister::new(maybe_register.unwrap())),
      _ => {
        validation.register.push(
          "The register must be a valid register.".to_string()
        );
        None
      }
    }
  }
}

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct TerrainGenPerlinValidation {
  #[serde(skip_serializing_if = "Vec::is_empty")]
  #[serde(default)]
  pub(crate) errors: Vec<String>,

  #[serde(skip_serializing_if = "Vec::is_empty")]
  #[serde(default)]
  pub(crate) seed: Vec<String>,

  #[serde(skip_serializing_if = "Vec::is_empty")]
  #[serde(default)]
  pub(crate) octaves: Vec<String>,

  #[serde(skip_serializing_if = "Vec::is_empty")]
  #[serde(default)]
  pub(crate) frequency: Vec<String>,

  #[serde(skip_serializing_if = "Vec::is_empty")]
  #[serde(default)]
  pub(crate) amplitude: Vec<String>,

  #[serde(skip_serializing_if = "Vec::is_empty")]
  #[serde(default)]
  pub(crate) register: Vec<String>,
}
impl TerrainGenPerlinValidation {
  pub(crate) fn new() -> Self {
    TerrainGenPerlinValidation {
      errors: Vec::new(),
      seed: Vec::new(),
      octaves: Vec::new(),
      frequency: Vec::new(),
      amplitude: Vec::new(),
      register: Vec::new(),
    }
  }

  pub(crate) fn is_valid(&self) -> bool {
    self.errors.is_empty()
      && self.seed.is_empty()
      && self.octaves.is_empty()
      && self.frequency.is_empty()
      && self.amplitude.is_empty()
      && self.register.is_empty()
  }
}
