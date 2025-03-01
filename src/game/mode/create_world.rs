
use crate::{
  data_store::DataStore,
  game::defaults,
  protocol::mode::create_world::{
    CreateWorldSubcmdEnvelope,
    CreateWorldSubcmdResponse,
    CurrentDescriptorInputCmd,
    CurrentDescriptorInputRsp,
    UpdateDescriptorInputCmd,
    BeginGenerationCmd,
  },
  world::{WorldDescriptor, WorldDescriptorInput, WorldDescriptorValidation}
};

pub(crate) struct CreateWorldMode {
  state: CreateWorldState,
}
impl CreateWorldMode {
  pub(crate) fn new_specify(descriptor_input: WorldDescriptorInput) -> Self {
    let specify_new_world_state = SpecifyNewWorldState {
      descriptor_input,
    };
    let state = CreateWorldState::SpecifyNewWorld(specify_new_world_state);
    CreateWorldMode { state }
  }

  pub(crate) fn handle_subcommand(&mut self,
    subcmd: CreateWorldSubcmdEnvelope,
    data_store: &mut DataStore
  ) -> CreateWorldSubcmdResponse {
    match subcmd {
      CreateWorldSubcmdEnvelope::CurrentDescriptorInput(cmd) =>
        self.handle_current_descriptor_input_cmd(cmd, data_store),
      CreateWorldSubcmdEnvelope::UpdateDescriptorInput(cmd) =>
        self.handle_update_descriptor_input_cmd(cmd, data_store),
      CreateWorldSubcmdEnvelope::BeginGeneration(cmd) =>
        self.handle_begin_generation_cmd(cmd, data_store),
    }
  }

  fn handle_current_descriptor_input_cmd(
    &mut self,
    current_descriptor_input_cmd: CurrentDescriptorInputCmd,
    data_store: &mut DataStore,
  ) -> CreateWorldSubcmdResponse {
    match &mut self.state {
      CreateWorldState::SpecifyNewWorld(ref mut specify_new_world_state) => {
        specify_new_world_state.handle_current_descriptor_input_cmd(
          current_descriptor_input_cmd,
          data_store
        )
      },
      _ => {
        CreateWorldSubcmdResponse::Failed(
          vec!["Must be in SpecifyNewWorld state to issue this command.".to_string()]
        )
      }
    }
  }

  fn handle_update_descriptor_input_cmd(
    &mut self,
    update_descriptor_input_cmd: UpdateDescriptorInputCmd,
    data_store: &DataStore,
  ) -> CreateWorldSubcmdResponse {
    match &mut self.state {
      CreateWorldState::SpecifyNewWorld(ref mut specify_new_world_state) => {
        specify_new_world_state.handle_update_descriptor_input_cmd(
          update_descriptor_input_cmd,
          data_store
        )
      },
      _ => {
        CreateWorldSubcmdResponse::Failed(
          vec!["Must be in SpecifyNewWorld state to issue this command.".to_string()]
        )
      }
    }
  }

  fn handle_begin_generation_cmd(
    &mut self,
    _begin_generation_cmd: BeginGenerationCmd,
    data_store: &DataStore,
  ) -> CreateWorldSubcmdResponse {
    let descriptor = match &mut self.state {
      CreateWorldState::SpecifyNewWorld(ref mut specify_new_world_state) => {
        match specify_new_world_state.validate_current(data_store) {
          Ok(descriptor) => descriptor,
          Err(_) => {
            return CreateWorldSubcmdResponse::Failed(
              vec!["World descriptor input is not valid".to_string()]
            )
          }
        }
      },
      _ => {
        return CreateWorldSubcmdResponse::Failed(
          vec![
            "Must be in SpecifyNewWorld state to begin world generation"
              .to_string(),
          ]
        );
      }
    };

    self.state = CreateWorldState::GeneratingWorld(
      GeneratingWorldState {
        descriptor,
      }
    );

    CreateWorldSubcmdResponse::Ok {}
  }
}

enum CreateWorldState {
  SpecifyNewWorld(SpecifyNewWorldState),
  GeneratingWorld(GeneratingWorldState)
}

struct SpecifyNewWorldState {
  descriptor_input: WorldDescriptorInput,
}
impl SpecifyNewWorldState {
  fn handle_current_descriptor_input_cmd(&mut self,
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

  fn handle_update_descriptor_input_cmd(&mut self,
    update_descriptor_input_cmd: UpdateDescriptorInputCmd,
    data_store: &DataStore,
  ) -> CreateWorldSubcmdResponse {
    self.descriptor_input = update_descriptor_input_cmd.descriptor;
    match self.validate_current(data_store) {
      Ok(_) => CreateWorldSubcmdResponse::Ok {},
      Err(validation) =>
        CreateWorldSubcmdResponse::InvalidWorldDescriptor(validation)
    }
  }

  fn validate_current(&self, data_store: &DataStore)
    -> Result<WorldDescriptor, WorldDescriptorValidation>
  {
    let ruleset_entries = data_store.rulesets().list().iter().map(
      |entry| entry.clone().into_ruleset_entry()
    ).collect::<Vec<_>>();
    let limits = defaults::world_descriptor_limits();
    self.descriptor_input.to_world_descriptor(limits, &ruleset_entries)
  }
}

struct GeneratingWorldState {
  descriptor: WorldDescriptor,
}
