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
    match (perlin, stage) {
      (Ok(perlin), Ok(stage)) => Ok(TerrainGenRules { perlin, stage }),
      (Err(perlin_validation), Err(stage_validation)) => {
        let mut validation = TerrainGenValidation::new();
        validation.perlin = Some(perlin_validation);
        validation.stage = Some(stage_validation);
        Err(validation)
      },
      (Err(perlin_validation), _) => {
        let mut validation = TerrainGenValidation::new();
        validation.perlin = Some(perlin_validation);
        Err(validation)
      },
      (_, Err(stage_validation)) => {
        let mut validation = TerrainGenValidation::new();
        validation.stage = Some(stage_validation);
        Err(validation)
      },
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

  // Number of iterations to run pairwise/merge programs.
  pub(crate) iterations: u32,

  // The pairwise tile processing program.
  #[serde(rename = "pairwiseProgram")]
  pub(crate) pairwise_program: ShasmProgram,
  // The number of output registers from the pairwise program.
  #[serde(rename = "pairwiseOutputRegisters")]
  pub(crate) pairwise_output_registers: u8,

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
pub(crate) struct TerrainGenStageInput {
  pub(crate) format: FormatInput,

  #[serde(rename = "initProgram")]
  pub(crate) init_program: String,

  pub(crate) iterations: String,

  #[serde(rename = "pairwiseProgram")]
  pub(crate) pairwise_program: String,

  #[serde(rename = "pairwiseOutputRegisters")]
  pub(crate) pairwise_output_registers: String,

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
      iterations: "".to_string(),
      pairwise_program: "".to_string(),
      pairwise_output_registers: "".to_string(),
      merge_program: "".to_string(),
      final_program: "".to_string(),
    }
  }

  pub(crate) fn to_validated(&self) -> Result<TerrainGenStageRules, TerrainGenStageValidation> {
    let maybe_format = self.format.to_validated();
    let maybe_init_program = ShasmProgram::to_validated(&self.init_program);
    let maybe_iterations = self.iterations.parse::<u32>();
    let maybe_pairwise_program = ShasmProgram::to_validated(&self.pairwise_program);
    let maybe_pairwise_output_registers = self.pairwise_output_registers.parse::<u8>();
    let maybe_merge_program = ShasmProgram::to_validated(&self.merge_program);
    let maybe_final_program = ShasmProgram::to_validated(&self.final_program);

    if maybe_format.is_err() ||
       maybe_init_program.is_err() ||
        maybe_iterations.is_err() ||
        maybe_pairwise_program.is_err() ||
        maybe_pairwise_output_registers.is_err() ||
        maybe_merge_program.is_err() ||
        maybe_final_program.is_err() {
      let mut validation = TerrainGenStageValidation::new();
      validation.format = maybe_format.err();
      validation.init_program = maybe_init_program.err();
      if let Err(_) = maybe_iterations {
        validation.iterations.push("The iterations must be a positive number.".to_string());
      }
      validation.pairwise_program = maybe_pairwise_program.err();
      if let Err(_) = maybe_pairwise_output_registers {
        validation.pairwise_output_registers.push(
          "The pairwise output registers must be a positive number.".to_string()
        );
      }
      validation.merge_program = maybe_merge_program.err();
      validation.final_program = maybe_final_program.err();
      Err(validation)
    } else {
      Ok(TerrainGenStageRules {
        format: maybe_format.unwrap(),
        init_program: maybe_init_program.unwrap(),
        iterations: maybe_iterations.unwrap(),
        pairwise_program: maybe_pairwise_program.unwrap(),
        pairwise_output_registers: maybe_pairwise_output_registers.unwrap(),
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

  #[serde(skip_serializing_if = "Vec::is_empty")]
  pub(crate) iterations: Vec<String>,

  #[serde(rename = "pairwiseProgram")]
  #[serde(skip_serializing_if = "Option::is_none")]
  pub(crate) pairwise_program: Option<ShasmProgramValidation>,

  #[serde(rename = "pairwiseOutputRegisters")]
  #[serde(skip_serializing_if = "Vec::is_empty")]
  pub(crate) pairwise_output_registers: Vec<String>,

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
      iterations: Vec::new(),
      pairwise_program: None,
      pairwise_output_registers: Vec::new(),
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
  // The perlin parameters.
  pub(crate) seed: u64,
  pub(crate) octaves: u8,
  pub(crate) frequency: u8,
  pub(crate) amplitude: u8,

  // The register to store the result in.
  pub(crate) register: ShadyRegister,
}

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct TerrainGenPerlinInput {
  pub(crate) seed: String,
  pub(crate) octaves: String,
  pub(crate) frequency: String,
  pub(crate) amplitude: String,
  pub(crate) register: String,
}
impl TerrainGenPerlinInput {
  pub(crate) fn new() -> Self {
    TerrainGenPerlinInput {
      seed: "".to_string(),
      octaves: "".to_string(),
      frequency: "".to_string(),
      amplitude: "".to_string(),
      register: "".to_string(),
    }
  }

  pub(crate) fn to_validated(&self) -> Result<TerrainGenPerlinRules, TerrainGenPerlinValidation> {
    let mut validation = TerrainGenPerlinValidation::new();
    let maybe_seed = self.validate_seed(&mut validation);
    let maybe_octaves = self.validate_octaves(&mut validation);
    let maybe_frequency = self.validate_frequency(&mut validation);
    let maybe_amplitude = self.validate_amplitude(&mut validation);
    let maybe_register = self.validate_register(&mut validation);
    if maybe_seed.is_none() ||
      maybe_octaves.is_none() ||
      maybe_frequency.is_none() ||
      maybe_amplitude.is_none() ||
      maybe_register.is_none() {
      Err(validation)
    } else {
      Ok(TerrainGenPerlinRules {
        seed: maybe_seed.unwrap(),
        octaves: maybe_octaves.unwrap(),
        frequency: maybe_frequency.unwrap(),
        amplitude: maybe_amplitude.unwrap(),
        register: maybe_register.unwrap(),
      })
    }
      
  }

  fn validate_seed(&self, validation: &mut TerrainGenPerlinValidation) -> Option<u64> {
    if self.seed.is_empty() {
      validation.errors.push("The `seed` value is required.".to_string());
    }
    let maybe_seed = self.seed.parse::<u64>();
    match maybe_seed {
      Ok(_) => maybe_seed.ok(),
      _ => {
        validation.seed.push(
          "The seed must be a non-negative number.".to_string()
        );
        None
      }
    }
  }

  fn validate_octaves(&self, validation: &mut TerrainGenPerlinValidation) -> Option<u8> {
    if self.octaves.is_empty() {
      validation.errors.push("The `octaves` value is required.".to_string());
    }
    let maybe_octaves = self.octaves.parse::<u8>();
    match maybe_octaves {
      Ok(octaves) => {
        if octaves == 0 {
          validation.octaves.push(
            "The octaves must be a positive number.".to_string()
          );
          None
        } else {
          Some(octaves)
        }
      },
      _ => {
        validation.octaves.push(
          "The octaves must be a number.".to_string()
        );
        None
      }
    }
  }

  fn validate_frequency(&self, validation: &mut TerrainGenPerlinValidation) -> Option<u8> {
    if self.frequency.is_empty() {
      validation.errors.push("The `frequency` value is required.".to_string());
    }
    let maybe_frequency = self.frequency.parse::<u8>();
    match maybe_frequency {
      Ok(frequency) => {
        if frequency == 0 {
          validation.frequency.push(
            "The frequency must be a positive number.".to_string()
          );
          None
        } else {
          Some(frequency)
        }
      },
      _ => {
        validation.frequency.push("The frequency must be a number.".to_string());
        None
      },
    }
  }

  fn validate_amplitude(&self, validation: &mut TerrainGenPerlinValidation) -> Option<u8> {
    if self.amplitude.is_empty() {
      validation.errors.push("The `amplitude` value is required.".to_string());
    }
    let maybe_amplitude = self.amplitude.parse::<u8>();
    match maybe_amplitude {
      Ok(amplitude) => {
        if amplitude == 0 {
          validation.amplitude.push("The amplitude must be a positive number.".to_string());
          None
        } else {
          Some(amplitude)
        }
      },
      _ => {
        validation.amplitude.push("The amplitude must be a number.".to_string());
        None
      },
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
