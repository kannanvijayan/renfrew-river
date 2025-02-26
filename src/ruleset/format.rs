
/**
 * A format is a layout of 32-bit words in memory, within which different
 * bitfields are used to store different numerical values.
 */
#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct FormatRules {
  // The format for each word.
  #[serde(rename = "wordFormats")]
  pub(crate) word_formats: Vec<FormatWordRules>,
}

/**
 * The input for a format.
 */
#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct FormatInput {
  #[serde(rename = "wordFormats")]
  pub(crate) word_formats: Vec<FormatWordInput>,
}
impl FormatInput {
  pub(crate) fn new() -> Self {
    Self {
      word_formats: Vec::new(),
    }
  }

  pub(crate) fn to_validated(&self) -> Result<FormatRules, FormatValidation> {
    let mut validation = FormatValidation {
      errors: Vec::new(),
      word_formats: Vec::new(),
    };

    // Validate each word.
    let mut word_rules = Vec::new();
    for word in &self.word_formats {
      let maybe_validated = word.to_validated();
      match maybe_validated {
        Ok(validated) => word_rules.push(validated),
        Err(word_validation) => validation.word_formats.push(word_validation),
      }
    }

    if validation.is_valid() {
      Ok(FormatRules {
        word_formats: word_rules,
      })
    } else {
      Err(validation)
    }
  }
}

/**
 * The validation of a format.
 */
#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct FormatValidation {
  #[serde(skip_serializing_if = "Vec::is_empty")]
  pub(crate) errors: Vec<String>,

  #[serde(rename = "wordFormats")]
  #[serde(skip_serializing_if = "Vec::is_empty")]
  pub(crate) word_formats: Vec<FormatWordValidation>,
}
impl FormatValidation {
  pub(crate) fn is_valid(&self) -> bool {
    self.errors.is_empty()
      && self.word_formats.iter().all(|wf| wf.is_valid())
  }
}



/**
 * The format of a single word.
 */
#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct FormatWordRules {
  // The name of the word.
  pub(crate) name: String,

  // The bitfields in the word.
  pub(crate) components: Vec<FormatComponentRules>,
}

/**
 * The input for a word.
 */
#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct FormatWordInput {
  // The name of the word.
  pub(crate) name: String,

  // The bitfields in the word.
  pub(crate) components: Vec<FormatComponentInput>,
}
impl FormatWordInput {
  pub(crate) fn to_validated(&self) -> Result<FormatWordRules, FormatWordValidation> {
    let mut validation = FormatWordValidation {
      errors: Vec::new(),
      components: Vec::new(),
    };

    // Validate the name.
    if self.name.is_empty() {
      validation.errors.push("The name is required.".to_string());
    }

    // Validate each component.
    let mut component_rules = Vec::new();
    for component in &self.components {
      let maybe_validated = component.to_validated();
      match maybe_validated {
        Ok(validated) => component_rules.push(validated),
        Err(component_validation) => validation.components.push(component_validation),
      }
    }

    if validation.is_valid() {
      Ok(FormatWordRules {
        name: self.name.clone(),
        components: component_rules,
      })
    } else {
      Err(validation)
    }
  }
}

/**
 * The validation of a word.
 */
#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct FormatWordValidation {
  #[serde(skip_serializing_if = "Vec::is_empty")]
  pub(crate) errors: Vec<String>,

  #[serde(skip_serializing_if = "Vec::is_empty")]
  pub(crate) components: Vec<FormatComponentValidation>,
}
impl FormatWordValidation {
  pub(crate) fn is_valid(&self) -> bool {
    self.errors.is_empty()
      && self.components.iter().all(|c| c.is_valid())
  }
}

/**
 * A single component of a word.
 */
#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct FormatComponentRules {
  // The name of the component.
  pub(crate) name: String,

  // The offset of the component in the word.
  pub(crate) offset: u8,

  // The number of bits in the component.
  pub(crate) bits: u8,
}

/**
 * The input for a component.
 */
#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct FormatComponentInput {
  // The name of the component.
  pub(crate) name: String,

  // The offset of the component in the word.
  pub(crate) offset: String,

  // The number of bits in the component.
  pub(crate) bits: String,
}
impl FormatComponentInput {
  pub(crate) fn to_validated(&self) -> Result<FormatComponentRules, FormatComponentValidation> {
    let mut validation = FormatComponentValidation::new();
    let name = self.validate_name(&mut validation);
    let offset = self.validate_offset(&mut validation);
    let bits = self.validate_bits(&mut validation);

    // Consistency checks.
    if let (Some(offset), Some(bits)) = (offset, bits) {
      if offset + bits > 32 {
        validation.errors.push(
          "The offset and bits must not exceed 32.".to_string()
        );
      }
    }

    if validation.is_valid() {
      Ok(FormatComponentRules {
        name: name.unwrap(),
        offset: offset.unwrap(),
        bits: bits.unwrap(),
      })
    } else {
      Err(validation)
    }
  }

  fn validate_name(&self, validation: &mut FormatComponentValidation)
    -> Option<String>
  {
    if self.name.is_empty() {
      validation.name.push("The name is required.".to_string());
      None
    } else {
      Some(self.name.clone())
    }
  }

  fn validate_offset(&self, validation: &mut FormatComponentValidation)
    -> Option<u8>
  {
    // Validate the offset.
    if self.offset.is_empty() {
      validation.offset.push("The offset is required.".to_string());
      return None;
    }
    let maybe_offset = self.offset.parse::<u8>();
    let offset = match maybe_offset {
      Ok(offset) => {
        if offset > 31 {
          validation.offset.push("The offset must be less than 32.".to_string());
          return None
        } else {
          offset
        }
      },
      _ => {
        validation.offset.push("The offset must be a number.".to_string());
        return None
      },
    };
    Some(offset)
  }

  fn validate_bits(&self, validation: &mut FormatComponentValidation)
    -> Option<u8>
  {
    // Validate the bits.
    if self.bits.is_empty() {
      validation.bits.push("The `bits` value is required.".to_string());
      return None;
    }
    let maybe_bits = self.bits.parse::<u8>();
    let bits = match maybe_bits {
      Ok(bits) => {
        if bits > 32 {
          validation.bits.push("The bits must be <= 32.".to_string());
          return None;
        } else {
          bits
        }
      },
      _ => {
        validation.bits.push("The bits must be a number.".to_string());
        return None;
      },
    };
    Some(bits)
  }
}

/**
 * The validation of a component.
 */
#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct FormatComponentValidation {
  #[serde(skip_serializing_if = "Vec::is_empty")]
  pub(crate) errors: Vec<String>,

  #[serde(skip_serializing_if = "Vec::is_empty")]
  pub(crate) name: Vec<String>,

  #[serde(skip_serializing_if = "Vec::is_empty")]
  pub(crate) offset: Vec<String>,

  #[serde(skip_serializing_if = "Vec::is_empty")]
  pub(crate) bits: Vec<String>,
}
impl FormatComponentValidation {
  pub(crate) fn new() -> Self {
    Self {
      errors: Vec::new(),
      name: Vec::new(),
      offset: Vec::new(),
      bits: Vec::new(),
    }
  }

  pub(crate) fn is_valid(&self) -> bool {
    self.errors.is_empty()
      && self.name.is_empty()
      && self.offset.is_empty()
      && self.bits.is_empty()
  }
}
