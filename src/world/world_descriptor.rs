use super::{ WorldDims, WorldDimsInput };

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
  pub(crate) fn new() -> Self {
    WorldDescriptor {
      name: String::new(),
      description: String::new(),
      seed: String::new(),
      dims: WorldDims::new(0, 0),
      ruleset_name: String::new(),
    }
  }
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
