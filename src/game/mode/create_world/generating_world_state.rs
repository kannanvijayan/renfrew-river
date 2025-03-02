use crate::{
  cog::CogDevice,
  gpu::{CellDataBuffer, ProgramBuffer},
  ruleset::Ruleset,
  shady_vm::ShadyProgramIndex,
  world::WorldDescriptor,
};

pub(crate) enum GenerationPhasePoint {
  NewlyCreated,
  PreInitialize,
  CellInitialized,
  PreMerge,
  Finalized
}

pub(crate) enum GenerationPhase {
  RandGen,         // NewlyCreated -> PreInitialize
  InitializeCell,  // PreInitialize -> CellInitialized
  PairwiseStep,    // CellInitialized -> PreMerge
  PairwiseMerge,   // PreMerge -> CellInitialized
  Finalize,        // CellInitialized -> Finalized
}

pub(crate) struct GeneratingWorldState {
  descriptor: WorldDescriptor,
  ruleset: Ruleset,
  phase_point: GenerationPhasePoint,
  device: CogDevice,
  cell_data_buffer: CellDataBuffer,
  programs: GeneratingWorldPrograms,
}
impl GeneratingWorldState {
  pub(crate) fn new(descriptor: WorldDescriptor, ruleset: Ruleset) -> Self {
    let phase_point = GenerationPhasePoint::NewlyCreated;
    let device = CogDevice::new();
    let cell_data_buffer = CellDataBuffer::new(&device, descriptor.dims);
    let programs = GeneratingWorldPrograms::new(&device, &ruleset);
    GeneratingWorldState {
      descriptor,
      ruleset,
      phase_point,
      device,
      cell_data_buffer,
      programs,
    }
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
