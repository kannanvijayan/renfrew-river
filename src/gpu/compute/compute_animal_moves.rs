use crate::{
  world::{ AnimalData, Elevation },
  gpu::{ GpuDevice, GpuSeqBuffer, GpuMapBuffer }
};
use super::look_and_move::look_and_move_command;

/**
 * Initialize animals.
 */
pub(crate) async fn compute_animal_moves(
  device: &GpuDevice,
  elevations_map_buffer: &GpuMapBuffer<Elevation>,
  animals_list_buffer: &GpuSeqBuffer<AnimalData>,
) -> GpuSeqBuffer<u32> {

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
