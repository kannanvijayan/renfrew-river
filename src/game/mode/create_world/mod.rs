mod specify_new_world_state;
mod generating_world_state;

use crate::{
  data_store::DataStore,
  protocol::mode::create_world::{
    BeginGenerationCmd,
    CreateWorldSubcmdEnvelope,
    CreateWorldSubcmdResponse,
    CurrentDescriptorInputCmd,
    TakeGenerationStepCmd,
    UpdateDescriptorInputCmd,
  },
  world::{ WorldDescriptor, WorldDescriptorInput }
};
use self::{
  specify_new_world_state::SpecifyNewWorldState,
  generating_world_state::GeneratingWorldState,
};

pub(crate) struct CreateWorldMode {
  state: CreateWorldState,
}
impl CreateWorldMode {
  pub(crate) fn new_specify(descriptor_input: WorldDescriptorInput) -> Self {
    let specify_new_world_state = SpecifyNewWorldState::new(descriptor_input);
    let state = CreateWorldState::SpecifyNewWorld(specify_new_world_state);
    CreateWorldMode { state }
  }

  pub(crate) fn new_generate(
    descriptor: WorldDescriptor,
    data_store: &DataStore
  ) -> Self {
    let ruleset = data_store.rulesets().read(&descriptor.ruleset_name);
    let generating_world_state = GeneratingWorldState::new(descriptor, ruleset);
    let state = CreateWorldState::GeneratingWorld(generating_world_state);
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
      CreateWorldSubcmdEnvelope::TakeGenerationStep(cmd) =>
        self.handle_take_generation_step_cmd(cmd, data_store),
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
    *self = CreateWorldMode::new_generate(descriptor, data_store);
    CreateWorldSubcmdResponse::Ok {}
  }

  fn handle_take_generation_step_cmd(&mut self,
    cmd: TakeGenerationStepCmd,
    data_store: &DataStore,
  ) -> CreateWorldSubcmdResponse {
    match &mut self.state {
      CreateWorldState::GeneratingWorld(ref mut generating_world_state) => {
        generating_world_state.handle_take_generation_step_cmd(cmd)
      },
      _ => {
        CreateWorldSubcmdResponse::Failed(
          vec![
            "Must be in GeneratingWorld state to take a generation step"
              .to_string(),
          ]
        )
      }
    }
  }
}

enum CreateWorldState {
  SpecifyNewWorld(SpecifyNewWorldState),
  GeneratingWorld(GeneratingWorldState)
}
