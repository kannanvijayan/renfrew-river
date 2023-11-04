use crate::{
  world::{ AnimalData, Elevation, CellCoord },
  gpu::{ GpuDevice, GpuSeqBuffer, GpuMapBuffer }
};
use super::commands::look_and_move_command;

/**
 * Compute moves for animals.
 */
pub(crate) async fn compute_animal_moves(
  device: &GpuDevice,
  elevations_map_buffer: &GpuMapBuffer<Elevation>,
  animals_list_buffer: &GpuSeqBuffer<AnimalData>,
) -> GpuSeqBuffer<CellCoord> {

  let mut encoder = device.device().create_command_encoder(
    &wgpu::CommandEncoderDescriptor {
      label: Some("InitializeAnimalsEncoder"),
    }
  );

  let output_buffer = look_and_move_command(
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
