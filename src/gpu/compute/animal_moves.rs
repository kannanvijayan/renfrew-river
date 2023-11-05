use crate::{
  world::{ AnimalId, AnimalData, Elevation, CellCoord },
  gpu::{ GpuDevice, GpuSeqBuffer, GpuMapBuffer }
};
use super::commands::{
  move_animals_downhill_command,
  resolve_animal_move_conflicts_command,
  apply_animal_moves_command,
};

pub(crate) async fn compute_downhill_movement(
  device: &GpuDevice,
  elevations_map_buffer: &GpuMapBuffer<Elevation>,
  animals_list_buffer: &GpuSeqBuffer<AnimalData>,
) -> GpuSeqBuffer<CellCoord> {
  let mut encoder = device.device().create_command_encoder(
    &wgpu::CommandEncoderDescriptor {
      label: Some("InitializeAnimalsEncoder"),
    }
  );

  let output_buffer = move_animals_downhill_command(
    device,
    &mut encoder,
    elevations_map_buffer,
    animals_list_buffer,
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

pub(crate) async fn resolve_animal_move_conflicts(
  device: &GpuDevice,
  animals_list_buffer: &GpuSeqBuffer<AnimalData>,
  animal_positions_map_buffer: &GpuMapBuffer<AnimalId>,
  target_positions_buffer: &GpuSeqBuffer<CellCoord>,
) -> GpuMapBuffer<AnimalId> {
  let mut encoder = device.device().create_command_encoder(
    &wgpu::CommandEncoderDescriptor {
      label: Some("ResolveAnimalMoveConflictsEncoder"),
    }
  );

  let prior_time = std::time::Instant::now();

  let conflicts_buffer = resolve_animal_move_conflicts_command(
    device,
    &mut encoder,
    animals_list_buffer,
    animal_positions_map_buffer,
    target_positions_buffer,
  );

  // Submit the commands.
  let submission_index = device.queue().submit(Some(encoder.finish()));

  // Wait for the commands to finish.
  device.device().poll(wgpu::Maintain::WaitForSubmissionIndex(submission_index));

  let elapsed = prior_time.elapsed();
  log::info!("resolve_animal_move_conflicts(elapsed_ms={})", elapsed.as_millis());

  conflicts_buffer
}

pub(crate) async fn apply_animal_moves(
  device: &GpuDevice,
  target_positions_buffer: &GpuSeqBuffer<CellCoord>,
  conflicts_map_buffer: &GpuMapBuffer<AnimalId>,
  animals_list_buffer: &GpuSeqBuffer<AnimalData>,
  animal_positions_map_buffer: &GpuMapBuffer<AnimalId>,
) {
  let mut encoder = device.device().create_command_encoder(
    &wgpu::CommandEncoderDescriptor {
      label: Some("ApplyAnimalMovesEncoder"),
    }
  );

  let prior_time = std::time::Instant::now();

  apply_animal_moves_command(
    device,
    &mut encoder,
    target_positions_buffer,
    conflicts_map_buffer,
    animals_list_buffer,
    animal_positions_map_buffer,
  );

  // Submit the commands.
  let submission_index = device.queue().submit(Some(encoder.finish()));

  // Wait for the commands to finish.
  device.device().poll(wgpu::Maintain::WaitForSubmissionIndex(submission_index));

  let elapsed = prior_time.elapsed();
  log::info!("apply_animal_moves(elapsed_ms={})", elapsed.as_millis());
}
