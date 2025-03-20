use crate::{
  data_store::DataStore,
  game::defaults,
  protocol::mode::create_world::{
    CreateWorldSubcmdResponse,
    CurrentDescriptorInputCmd,
    CurrentDescriptorInputRsp,
    UpdateDescriptorInputCmd,
  },
  data::map::{
    WorldDescriptor,
    WorldDescriptorInput,
    WorldDescriptorValidation
  }
};

pub(crate) struct SpecifyNewWorldState {
  descriptor_input: WorldDescriptorInput,
}
impl SpecifyNewWorldState {
  pub(crate) fn new(descriptor_input: WorldDescriptorInput) -> Self {
    SpecifyNewWorldState { descriptor_input }
  }

  pub(crate) fn handle_current_descriptor_input_cmd(&mut self,
    _current_descriptor_input_cmd: CurrentDescriptorInputCmd,
    data_store: &DataStore,
  ) -> CreateWorldSubcmdResponse {
    let validation = self.validate_current(data_store).err();
    let rsp = CurrentDescriptorInputRsp {
      descriptor: self.descriptor_input.clone(),
      validation,
    };
    CreateWorldSubcmdResponse::CurrentDescriptorInput(rsp)
  }

  pub(crate) fn handle_update_descriptor_input_cmd(&mut self,
    update_descriptor_input_cmd: UpdateDescriptorInputCmd,
    data_store: &DataStore,
  ) -> CreateWorldSubcmdResponse {
    self.descriptor_input = update_descriptor_input_cmd.descriptor;
    match self.validate_current(data_store) {
      Ok(descriptor) =>
        CreateWorldSubcmdResponse::ValidWorldDescriptor(descriptor),
      Err(validation) =>
        CreateWorldSubcmdResponse::InvalidWorldDescriptor(validation)
    }
  }

  pub(crate) fn validate_current(&self, data_store: &DataStore)
    -> Result<WorldDescriptor, WorldDescriptorValidation>
  {
    let ruleset_entries = data_store.rulesets().list().iter().map(
      |entry| entry.clone().into_ruleset_entry()
    ).collect::<Vec<_>>();
    let limits = defaults::world_descriptor_limits();
    self.descriptor_input.to_world_descriptor(limits, &ruleset_entries)
  }
}
