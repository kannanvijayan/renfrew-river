use crate::{
  gpu::{
    GpuBufferOptions,
    GpuDevice,
    GpuMapBuffer,
    GpuSeqBuffer,
    ShadyProgramIndex,
    ShadyRegisterFile,
    world::{ GpuProgramStore, GpuElevationMap, GpuAnimalsList, GpuAnimalsMap },
  },
  world::{ AnimalData, AnimalId, CellCoord, Elevation, WorldDims },
};
use super::commands::{
  fill_map_u32_command,
  move_animals_downhill_command,
  resolve_animal_move_conflicts_command,
  apply_animal_moves_command,
  fill_registers_for_animal_move,
  readout_registers_for_animal_move,
  shady_interp_command,
};

pub(crate) async fn compute_downhill_movement(
  device: &GpuDevice,
  elevations_map: &GpuElevationMap,
  animals_list: &GpuAnimalsList,
) -> GpuSeqBuffer<CellCoord> {
  let mut encoder = device.device().create_command_encoder(
    &wgpu::CommandEncoderDescriptor {
      label: Some("ComputeDownhillMovementEncoder"),
    }
  );

  let output_buffer = move_animals_downhill_command(
    device,
    &mut encoder,
    elevations_map,
    animals_list,
  );

  let prior_time = std::time::Instant::now();

  // Submit the commands.
  let submission_index = device.queue().submit(Some(encoder.finish()));

  // Wait for the commands to finish.
  device.device().poll(wgpu::Maintain::WaitForSubmissionIndex(submission_index));

  let elapsed = prior_time.elapsed();
  log::info!("compute_animal_moves(elapsed_ms={})", elapsed.as_millis());

  output_buffer
}

pub(crate) async fn compute_downhill_movement_with_shady_vm(
  device: &GpuDevice,
  program_store: &GpuProgramStore,
  elevations_map: &GpuElevationMap,
  animals_list: &GpuAnimalsList,
) -> GpuSeqBuffer<CellCoord> {
  let start_pc_buffer = GpuSeqBuffer::<u32>::new(
    device,
    animals_list.num_animals(),
    GpuBufferOptions::empty()
      .with_label("ComputeDownhillMovementStartPcBuffer")
      .with_storage(true)
  );

  let program_index =
    program_store.lookup_program_index("move_animals_downhill")
      .expect("Program 'move_animals_downhill' not found");

  let register_file_buffer = fill_registers(
    device,
    elevations_map,
    animals_list,
    program_index,
    &start_pc_buffer,
  ).await;

  let _end_pc_buffer = run_program(
    device,
    program_store,
    animals_list.num_animals() as u32,
    /* num_ins */ 100,
    &start_pc_buffer,
    &register_file_buffer,
  ).await;

  let output_buffer = read_program_result(
    device,
    elevations_map.dims(),
    animals_list,
    &start_pc_buffer,
    &register_file_buffer,
  ).await;

  output_buffer
}

async fn fill_registers(
  device: &GpuDevice,
  elevations_map: &GpuElevationMap,
  animals_list: &GpuAnimalsList,
  start_pc: ShadyProgramIndex,
  start_pc_buffer: &GpuSeqBuffer<u32>,
) -> GpuSeqBuffer<ShadyRegisterFile> {
  let mut encoder = device.device().create_command_encoder(
    &wgpu::CommandEncoderDescriptor {
      label: Some("FillRegistersForAnimalMoveEncoder"),
    }
  );

  let register_file_buffer = fill_registers_for_animal_move(
    device,
    &mut encoder,
    elevations_map,
    animals_list,
    start_pc,
    start_pc_buffer,
  );

  let prior_time = std::time::Instant::now();

  // Submit the commands.
  let submission_index = device.queue().submit(Some(encoder.finish()));

  // Wait for the commands to finish.
  device.device().poll(wgpu::Maintain::WaitForSubmissionIndex(submission_index));

  let elapsed = prior_time.elapsed();
  log::info!("shadyvm_fill_registers(elapsed_ms={})", elapsed.as_millis());

  register_file_buffer
}

async fn run_program(
  device: &GpuDevice,
  program_store: &GpuProgramStore,
  num_vms: u32,
  num_ins: u32,
  start_pc_buffer: &GpuSeqBuffer<u32>,
  register_file_buffer: &GpuSeqBuffer<ShadyRegisterFile>,
) -> GpuSeqBuffer<u32> {
  let mut encoder = device.device().create_command_encoder(
    &wgpu::CommandEncoderDescriptor {
      label: Some("RunVmForAnimalMoveEncoder"),
    }
  );

  let end_pc_buffer =
    GpuSeqBuffer::<u32>::new(
      device,
      num_vms as usize,
      GpuBufferOptions::empty()
        .with_label("RunVmForAnimalMoveEndPcBuffer")
        .with_storage(true)
        .with_copy_src(true),
    );

  shady_interp_command(
    device,
    &mut encoder,
    num_vms,
    num_ins,
    program_store.buffer(),
    start_pc_buffer,
    &end_pc_buffer,
    register_file_buffer,
  );

  let prior_time = std::time::Instant::now();

  // Submit the commands.
  let submission_index = device.queue().submit(Some(encoder.finish()));

  // Wait for the commands to finish.
  device.device().poll(wgpu::Maintain::WaitForSubmissionIndex(submission_index));

  let elapsed = prior_time.elapsed();
  log::info!("shadyvm_interp_moves(elapsed_ms={})", elapsed.as_millis());

  end_pc_buffer
}

async fn read_program_result(
  device: &GpuDevice,
  world_dims: WorldDims,
  animals_list: &GpuAnimalsList,
  start_pc_buffer: &GpuSeqBuffer<u32>,
  register_file_buffer: &GpuSeqBuffer<ShadyRegisterFile>,
) -> GpuSeqBuffer<CellCoord> {
  let mut encoder = device.device().create_command_encoder(
    &wgpu::CommandEncoderDescriptor {
      label: Some("ReadProgramResultEncoder"),
    }
  );

  let cell_coord_buffer = readout_registers_for_animal_move(
    device,
    &mut encoder,
    world_dims,
    animals_list.buffer(),
    start_pc_buffer,
    register_file_buffer,
  );

  // Submit the commands.
  let submission_index = device.queue().submit(Some(encoder.finish()));

  // Wait for the commands to finish.
  device.device().poll(wgpu::Maintain::WaitForSubmissionIndex(submission_index));

  cell_coord_buffer
}

pub(crate) async fn resolve_animal_move_conflicts(
  device: &GpuDevice,
  animals_list: &GpuAnimalsList,
  animal_positions_map: &GpuAnimalsMap,
  target_positions_buffer: &GpuSeqBuffer<CellCoord>,
) -> GpuAnimalsMap {
  let world_dims = animal_positions_map.dims();

  let mut encoder = device.device().create_command_encoder(
    &wgpu::CommandEncoderDescriptor {
      label: Some("ResolveAnimalMoveConflictsEncoder"),
    }
  );

  let prior_time = std::time::Instant::now();

  let conflicts = GpuAnimalsMap::new(
    device,
    world_dims,
    "ComputeDownhillMovementConflicts"
  );

  fill_map_u32_command(
    device,
    &mut encoder,
    conflicts.buffer().cast_as_native_type(),
    AnimalId::INVALID.to_u32(),
  );

  resolve_animal_move_conflicts_command(
    device,
    &mut encoder,
    animals_list,
    animal_positions_map,
    target_positions_buffer,
    &conflicts,
  );

  // Submit the commands.
  let submission_index = device.queue().submit(Some(encoder.finish()));

  // Wait for the commands to finish.
  device.device().poll(wgpu::Maintain::WaitForSubmissionIndex(submission_index));

  let elapsed = prior_time.elapsed();
  log::info!("resolve_animal_move_conflicts(elapsed_ms={})", elapsed.as_millis());

  conflicts
}

pub(crate) async fn apply_animal_moves(
  device: &GpuDevice,
  target_positions_buffer: &GpuSeqBuffer<CellCoord>,
  conflicts_map: &GpuAnimalsMap,
  animals_list: &GpuAnimalsList,
  animal_positions_map: &GpuAnimalsMap,
) {
  let mut encoder = device.device().create_command_encoder(
    &wgpu::CommandEncoderDescriptor {
      label: Some("ApplyAnimalMovesEncoder"),
    }
  );

  let prior_time = std::time::Instant::now();

  let why_buffer = GpuSeqBuffer::<u32>::new(
    device,
    animals_list.num_animals(),
    GpuBufferOptions::empty()
      .with_copy_src(true)
      .with_storage(true),
  );


  apply_animal_moves_command(
    device,
    &mut encoder,
    target_positions_buffer,
    conflicts_map,
    animals_list,
    animal_positions_map,
    &why_buffer,
  );

  // Submit the commands.
  let submission_index = device.queue().submit(Some(encoder.finish()));

  // Wait for the commands to finish.
  device.device().poll(wgpu::Maintain::WaitForSubmissionIndex(submission_index));

  let elapsed = prior_time.elapsed();
  log::info!("apply_animal_moves(elapsed_ms={})", elapsed.as_millis());

  // Dump the why buffer.
  // KVIJ TODO: Remove this.
  /*
  if (false) {
    let whys = why_buffer
      .read_mappable_subseq_copy(device, 0, 16).await
      .to_vec().await;

    for why in whys {
      log::info!("XXXXX why={:x}", why);
    }
  }
  */
}
