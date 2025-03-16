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
    CurrentGenerationPhaseCmd,
    GetMapDataCmd,
    GetMinimapDataCmd,
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
      CreateWorldSubcmdEnvelope::CurrentGenerationPhase(cmd) =>
        self.handle_current_generation_phase_cmd(cmd),
      CreateWorldSubcmdEnvelope::GetMapData(cmd) =>
        self.handle_get_map_data_cmd(cmd, data_store),
      CreateWorldSubcmdEnvelope::GetMinimapData(cmd) =>
        self.handle_get_minimap_data_cmd(cmd, data_store),
    }
  }

  fn handle_current_descriptor_input_cmd(&mut self,
    cmd: CurrentDescriptorInputCmd,
    data_store: &mut DataStore,
  ) -> CreateWorldSubcmdResponse {
    self.in_specify_new_world_state("get current descriptor input", |st| {
      st.handle_current_descriptor_input_cmd(cmd, data_store)
    })
  }

  fn handle_update_descriptor_input_cmd(&mut self,
    cmd: UpdateDescriptorInputCmd,
    data_store: &DataStore,
  ) -> CreateWorldSubcmdResponse {
    self.in_specify_new_world_state("update descriptor input", |st| {
      st.handle_update_descriptor_input_cmd(cmd, data_store)
    })
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
    _data_store: &DataStore,
  ) -> CreateWorldSubcmdResponse {
    self.in_generating_world_state("take generation step", |st| {
      st.handle_take_generation_step_cmd(cmd)
    })
  }

  fn handle_current_generation_phase_cmd(&mut self,
    cmd: CurrentGenerationPhaseCmd,
  ) -> CreateWorldSubcmdResponse {
    self.in_generating_world_state("get current generation phase", |st| {
      st.handle_current_generation_phase_cmd(cmd)
    })
  }

  fn handle_get_map_data_cmd(&mut self,
    cmd: GetMapDataCmd,
    data_store: &DataStore,
  ) -> CreateWorldSubcmdResponse {
    self.in_generating_world_state("get map data", |st| {
      st.handle_get_map_data_cmd(cmd, data_store)
    })
  }

  fn handle_get_minimap_data_cmd(&mut self,
    cmd: GetMinimapDataCmd,
    data_store: &DataStore,
  ) -> CreateWorldSubcmdResponse {
    self.in_generating_world_state("get minimap data", |st| {
      st.handle_get_minimap_data_cmd(cmd, data_store)
    })
  }

  fn in_generating_world_state<F>(&mut self, reason: &str, func: F)
    -> CreateWorldSubcmdResponse
    where F: FnOnce(&mut GeneratingWorldState) -> CreateWorldSubcmdResponse
  {
    match &mut self.state {
      CreateWorldState::GeneratingWorld(ref mut generating_world_state) => {
        func(generating_world_state)
      },
      _ => {
        CreateWorldSubcmdResponse::Failed(
          vec![
            format!("Must be in GeneratingWorld state to {}", reason)
              .to_string(),
          ]
        )
      }
    }
  }

  fn in_specify_new_world_state<F>(&mut self, reason: &str, func: F)
    -> CreateWorldSubcmdResponse
    where F: FnOnce(&mut SpecifyNewWorldState) -> CreateWorldSubcmdResponse
  {
    match &mut self.state {
      CreateWorldState::SpecifyNewWorld(ref mut specify_new_world_state) => {
        func(specify_new_world_state)
      },
      _ => {
        CreateWorldSubcmdResponse::Failed(
          vec![
            format!("Must be in SpecifyNewWorld state to {}", reason)
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
