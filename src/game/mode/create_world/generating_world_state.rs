use crate::{
  cog::{ CogDevice, CogTask },
  gpu::{ task::create_world::RandGenTask, CellDataBuffer, ProgramBuffer, ShaderRegistry },
  protocol::mode::create_world::{
    CreateWorldSubcmdResponse, CurrentGenerationPhaseCmd, CurrentGenerationPhaseRsp, TakeGenerationStepCmd
  },
  ruleset::Ruleset,
  shady_vm::ShadyProgramIndex,
  world::{ CellCoord, GenerationPhase, GenerationStepKind, WorldDescriptor },
};

pub(crate) struct GeneratingWorldState {
  descriptor: WorldDescriptor,
  ruleset: Ruleset,
  phase: GenerationPhase,
  device: CogDevice,
  shaders: ShaderRegistry,
  cell_data_buffer: CellDataBuffer,
  programs: GeneratingWorldPrograms,
}
impl GeneratingWorldState {
  pub(crate) fn new(descriptor: WorldDescriptor, ruleset: Ruleset) -> Self {
    let phase = GenerationPhase::NewlyCreated;
    let device = CogDevice::new();
    let shaders = ShaderRegistry::new(&device);
    let cell_data_buffer = CellDataBuffer::new(&device, descriptor.dims);
    let programs = GeneratingWorldPrograms::new(&device, &ruleset);
    // TODO !!!!FIXME!!!!
    let mut state = GeneratingWorldState {
      descriptor,
      ruleset,
      phase,
      device,
      shaders,
      cell_data_buffer,
      programs,
    };
    state.handle_take_generation_step_cmd(TakeGenerationStepCmd {
      kind: GenerationStepKind::RandGen
    });
    state
  }

  pub(crate) fn handle_take_generation_step_cmd(&mut self,
    cmd: TakeGenerationStepCmd,
  ) -> CreateWorldSubcmdResponse {
    match cmd.kind {
      GenerationStepKind::RandGen => self.step_rand_gen(),
      GenerationStepKind::InitializeCell => self.step_initialize_cell(),
      GenerationStepKind::PairwiseStep => self.step_pairwise_step(),
      GenerationStepKind::PairwiseMerge => self.step_pairwise_merge(),
      GenerationStepKind::Finalize => self.step_finalize(),
    }
  }

  pub(crate) fn handle_current_generation_phase_cmd(&mut self,
    _cmd: CurrentGenerationPhaseCmd,
  )
    -> CreateWorldSubcmdResponse
  {
    CreateWorldSubcmdResponse::CurrentGenerationPhase(
      CurrentGenerationPhaseRsp { phase: self.phase }
    )
  }

  fn step_rand_gen(&mut self) -> CreateWorldSubcmdResponse {
    if self.phase != GenerationPhase::NewlyCreated {
      return CreateWorldSubcmdResponse::Failed(vec![
        format!(
          "Cannot perform RandGen step in phase {}",
          self.phase.to_str()
        ),
      ]);
    }
    let rand_mapbuf = self.device.create_map_buffer::<u32>(
      self.descriptor.dims,
      "RandGen_Output"
    );
    let randgen_task = RandGenTask::new(
      self.descriptor.dims,
      self.descriptor.seed_u32(),
      rand_mapbuf.clone()
    );
    self.device.encode_and_run("CreateWorld_RandGen", |enc| {
      randgen_task.encode(enc);
    });

    self.phase = GenerationPhase::PreInitialize;
    CreateWorldSubcmdResponse::Ok {}
  }

  fn step_initialize_cell(&mut self) -> CreateWorldSubcmdResponse {
    if self.phase != GenerationPhase::PreInitialize {
      return CreateWorldSubcmdResponse::Failed(vec![
        format!(
          "Cannot perform InitializeCell step in phase {}",
          self.phase.to_str()
        ),
      ]);
    }
    self.phase = GenerationPhase::CellInitialized;
    CreateWorldSubcmdResponse::Ok {}
  }

  fn step_pairwise_step(&mut self) -> CreateWorldSubcmdResponse {
    if self.phase != GenerationPhase::CellInitialized {
      return CreateWorldSubcmdResponse::Failed(vec![
        format!(
          "Cannot perform PairwiseStep step in phase {}",
          self.phase.to_str()
        ),
      ]);
    }
    self.phase = GenerationPhase::PreMerge;
    CreateWorldSubcmdResponse::Ok {}
  }

  fn step_pairwise_merge(&mut self) -> CreateWorldSubcmdResponse {
    if self.phase != GenerationPhase::PreMerge {
      return CreateWorldSubcmdResponse::Failed(vec![
        format!(
          "Cannot perform PairwiseMerge step in phase {}",
          self.phase.to_str()
        ),
      ]);
    }
    self.phase = GenerationPhase::CellInitialized;
    CreateWorldSubcmdResponse::Ok {}
  }

  fn step_finalize(&mut self) -> CreateWorldSubcmdResponse {
    if self.phase != GenerationPhase::CellInitialized {
      return CreateWorldSubcmdResponse::Failed(vec![
        format!(
          "Cannot perform Finalize step in phase {}",
          self.phase.to_str()
        ),
      ]);
    }
    self.phase = GenerationPhase::Finalized;
    CreateWorldSubcmdResponse::Ok {}
  }
}

pub(crate) struct GeneratingWorldPrograms {
  program_buffer: ProgramBuffer,
  init_program_index: ShadyProgramIndex,
  pairwise_program_index: ShadyProgramIndex,
  merge_program_index: ShadyProgramIndex,
  final_program_index: ShadyProgramIndex,
}
impl GeneratingWorldPrograms {
  pub(crate) fn new(device: &CogDevice, ruleset: &Ruleset) -> Self {
    let mut program_buffer = ProgramBuffer::new(device);
    let stage = &ruleset.terrain_gen.stage;

    let init_program_index = program_buffer.add_program(
      "TerrainGen_Init",
      stage.init_program.parse_shady_program()
        .expect("Failed to parse init program")
    );
    let pairwise_program_index = program_buffer.add_program(
      "TerrainGen_Pairwise",
      stage.pairwise_program.parse_shady_program()
        .expect("Failed to parse pairwise program")
    );
    let merge_program_index = program_buffer.add_program(
      "TerrainGen_Merge",
      stage.merge_program.parse_shady_program()
        .expect("Failed to parse merge program")
    );
    let final_program_index = program_buffer.add_program(
      "TerrainGen_Final",
      stage.final_program.parse_shady_program()
        .expect("Failed to parse final program")
    );

    program_buffer.sync_gpu_buffer();

    GeneratingWorldPrograms {
      program_buffer,
      init_program_index,
      pairwise_program_index,
      merge_program_index,
      final_program_index,
    }
  }
} 

/**
 * Keeps track of the visually focused region of the world.
 */
pub(crate) struct GeneratingWorldViewState {

}
