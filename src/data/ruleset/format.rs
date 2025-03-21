use super::{
  format_word::{
    FormatWordInput,
    FormatWordRules,
    FormatWordValidation,
  },
  format_component::{
    FormatComponentSelector,
    FormatComponentRules,
  },
};

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
impl FormatRules {
  pub(crate) fn new_example() -> Self {
    let word_formats = vec![
      FormatWordRules {
        name: "ExampleWord".to_string(),
        components: vec![
          FormatComponentRules {
            name: "Component1".to_string(),
            offset: 0,
            bits: 8,
          },
          FormatComponentRules {
            name: "Component2".to_string(),
            offset: 8,
            bits: 8,
          },
        ],
      },
    ];
    Self { word_formats }
  }

  pub(crate) fn to_input(&self) -> FormatInput {
    let word_formats = self.word_formats.iter()
      .map(|wf| wf.to_input()).collect();
    FormatInput { word_formats }
  }

  pub(crate) fn selector_for(&self, word_name: &str, component_name: &str)
    -> Option<FormatComponentSelector>
  {
    for (word_index, word) in self.word_formats.iter().enumerate() {
      if word.name == word_name {
        for component in &word.components {
          if component.name == component_name {
            return Some(FormatComponentSelector {
              word: word_index as u8,
              offset: component.offset,
              count: component.bits,
            });
          }
        }
      }
    }
    None
  }
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
