use crate::ruleset::RulesetEntry;

use super::{ WorldDims, WorldDimsInput, WorldDimsValidation };

#[derive(Clone, Debug)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct WorldDescriptor {
  pub(crate) name: String,
  pub(crate) description: String,
  pub(crate) seed: String,
  pub(crate) dims: WorldDims,
  #[serde(rename = "rulesetName")]
  pub(crate) ruleset_name: String,
}
impl WorldDescriptor {
  pub(crate) fn to_input(&self) -> WorldDescriptorInput {
    WorldDescriptorInput {
      name: self.name.clone(),
      description: self.description.clone(),
      seed: self.seed.clone(),
      dims: self.dims.to_input(),
      ruleset_name: self.ruleset_name.clone(),
    }
  }
}

pub(crate) struct WorldDescriptorLimits {
  pub(crate) min_dims: WorldDims,
  pub(crate) max_dims: WorldDims,
  pub(crate) max_description_length: usize,
}

#[derive(Clone, Debug)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct WorldDescriptorInput {
  pub(crate) name: String,
  pub(crate) description: String,
  pub(crate) seed: String,
  pub(crate) dims: WorldDimsInput,
  #[serde(rename = "rulesetName")]
  pub(crate) ruleset_name: String,
}
impl WorldDescriptorInput {
  pub(crate) fn to_world_descriptor(&self,
    limits: WorldDescriptorLimits,
    ruleset_entries: &[RulesetEntry],
  ) -> Result<WorldDescriptor, WorldDescriptorValidation> {
    let errors = Vec::new();
    let mut name_errors = Vec::new();
    let mut description_errors = Vec::new();
    let mut seed_errors = Vec::new();
    let mut dims_validation = WorldDimsValidation::new_valid();
    let mut ruleset_name_errors = Vec::new();

    let name = if self.name.len() > 0 {
      self.name.clone()
    } else {
      name_errors.push("Name is empty.".to_string());
      String::new()
    };

    let description = if self.description.len() <= limits.max_description_length {
      self.description.clone()
    } else {
      description_errors.push("Description is too long.".to_string());
      String::new()
    };

    let seed = if self.seed.len() > 0 {
      self.seed.clone()
    } else {
      seed_errors.push("Seed is empty.".to_string());
      String::new()
    };

    let dims = match self.dims.to_world_dims(limits.min_dims, limits.max_dims) {
      Ok(value) => value,
      Err(validation) => {
        dims_validation = validation;
        WorldDims::new(0, 0)
      },
    };

    let ruleset_name = if self.ruleset_name.len() > 0 {
      self.ruleset_name.clone()
    } else {
      ruleset_name_errors.push("Ruleset name is empty.".to_string());
      String::new()
    };

    if ! ruleset_entries.iter().any(|entry| entry.name == ruleset_name) {
      ruleset_name_errors.push("Ruleset not found.".to_string());
    }

    if errors.is_empty()
      && name_errors.is_empty()
      && description_errors.is_empty()
      && seed_errors.is_empty()
      && dims_validation.is_valid()
      && ruleset_name_errors.is_empty()
    {
      Ok(WorldDescriptor {
        name,
        description,
        seed,
        dims,
        ruleset_name,
      })
    } else {
      Err(WorldDescriptorValidation {
        errors,
        name: name_errors,
        description: description_errors,
        seed: seed_errors,
        dims: dims_validation,
        ruleset_name: ruleset_name_errors,
      })
    }
  }
}

#[derive(Clone, Debug)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct WorldDescriptorValidation {
  pub(crate) errors: Vec<String>,
  pub(crate) name: Vec<String>,
  pub(crate) description: Vec<String>,
  pub(crate) seed: Vec<String>,
  pub(crate) dims: WorldDimsValidation,
  #[serde(rename = "rulesetName")]
  pub(crate) ruleset_name: Vec<String>,
}
