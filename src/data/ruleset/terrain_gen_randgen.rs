use crate::shady_vm::ShadyRegister;

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
