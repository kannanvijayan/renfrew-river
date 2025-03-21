use super::format_component::{
  FormatComponentInput,
  FormatComponentRules,
  FormatComponentValidation,
};

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
impl FormatWordRules {
  pub(crate) fn to_input(&self) -> FormatWordInput {
    let components = self.components.iter().map(|fc| fc.to_input()).collect();
    FormatWordInput {
      name: self.name.clone(),
      components,
    }
  }
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
