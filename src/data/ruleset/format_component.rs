
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
impl FormatComponentRules {
  pub(crate) fn to_input(&self) -> FormatComponentInput {
    FormatComponentInput {
      name: self.name.clone(),
      offset: self.offset.to_string(),
      bits: self.bits.to_string(),
    }
  }
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

/**
 * A component selector for a word within a format.
 */
#[derive(Debug, Clone, Copy)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct FormatComponentSelector {
  pub(crate) word: u8,
  pub(crate) offset: u8,
  pub(crate) count: u8,
}
impl FormatComponentSelector {
  pub(crate) const WORD_SHIFT: u32 = 0;
  pub(crate) const WORD_BITS: u32 = 5;
  pub(crate) const WORD_MASK: u32 = (1 << Self::WORD_BITS) - 1;

  pub(crate) const OFFSET_SHIFT: u32 = Self::WORD_BITS;
  pub(crate) const OFFSET_BITS: u32 = 5;
  pub(crate) const OFFSET_MASK: u32 = (1 << Self::OFFSET_BITS) - 1;

  pub(crate) const COUNT_SHIFT: u32 = Self::WORD_BITS + Self::OFFSET_BITS;
  pub(crate) const COUNT_BITS: u32 = 5;
  pub(crate) const COUNT_MASK: u32 = (1 << Self::COUNT_BITS) - 1;

  pub(crate) const fn new(word: u8, offset: u8, count: u8) -> Self {
    Self { word, offset, count }
  }

  pub(crate) fn to_u32(&self) -> u32 {
    let word = ((self.word as u32) & Self::WORD_MASK) << Self::WORD_SHIFT;
    let offset = ((self.offset as u32) & Self::OFFSET_MASK) << Self::OFFSET_SHIFT;
    let count = ((self.count as u32) & Self::COUNT_MASK) << Self::COUNT_SHIFT;
    word | offset | count
  }

  pub(crate) fn from_u32(value: u32) -> Self {
    let word = ((value >> Self::WORD_SHIFT) & Self::WORD_MASK) as u8;
    let offset = ((value >> Self::OFFSET_SHIFT) & Self::OFFSET_MASK) as u8;
    let count = ((value >> Self::COUNT_SHIFT) & Self::COUNT_MASK) as u8;
    Self { word, offset, count }
  }
}

#[derive(Debug, Clone, Copy)]
pub(crate) struct FormatComponentSelectorReadSpec {
  selector: FormatComponentSelector,
  out_index: u8,
}
impl FormatComponentSelectorReadSpec {
  pub(crate) const OUT_INDEX_SHIFT: u32 =
    FormatComponentSelector::COUNT_SHIFT + FormatComponentSelector::COUNT_BITS;
  pub(crate) const OUT_INDEX_BITS: u32 = 5;
  pub(crate) const OUT_INDEX_MASK: u32 = (1 << Self::OUT_INDEX_BITS) - 1;

  pub(crate) fn new(selector: FormatComponentSelector, out_index: u8) -> Self {
    Self { selector, out_index }
  }

  pub(crate) fn to_u32(&self) -> u32 {
    let index = self.out_index as u32 & Self::OUT_INDEX_MASK;
    self.selector.to_u32() | (index << Self::OUT_INDEX_SHIFT)
  }

  pub(crate) fn from_u32(value: u32) -> Self {
    let selector = FormatComponentSelector::from_u32(value);
    let out_index = (
      (value >> Self::OUT_INDEX_SHIFT) & Self::OUT_INDEX_MASK
    ) as u8;
    Self { selector, out_index }
  }
}
