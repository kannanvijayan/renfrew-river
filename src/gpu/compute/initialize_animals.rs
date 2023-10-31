use crate::{
  world::{ AnimalId, AnimalData },
  gpu::{ GpuDevice, GpuSeqBuffer, GpuMapBuffer }
};
use super::{
  fill_map_u32::fill_map_u32_command,
  init_animals::init_animals_command,
};

/**
 * Initialize animals.
 */
pub(crate) async fn initialize_animals(
  device: &GpuDevice,
  rand_seed: u32,
  animals_list_buffer: &GpuSeqBuffer<AnimalData>,
  animals_map_buffer: &GpuMapBuffer<AnimalId>,
) {

  let mut encoder = device.device().create_command_encoder(
    &wgpu::CommandEncoderDescriptor {
      label: Some("InitializeAnimalsEncoder"),
    }
  );

  fill_map_u32_command(
    device,
    &mut encoder,
    animals_map_buffer.cast_as_native_type(),
    AnimalId::INVALID.to_u32()
  );

  init_animals_command(
    device,
    &mut encoder,
    rand_seed,
    animals_list_buffer,
    animals_map_buffer,
  );

  let prior_time = std::time::Instant::now();

  // Submit the commands.
  let submission_index = device.queue().submit(Some(encoder.finish()));

  // Wait for the commands to finish.
  device.device().poll(wgpu::Maintain::WaitForSubmissionIndex(submission_index));

  let elapsed = prior_time.elapsed();
  log::info!("initialize_animals(elapsed_ms={})", elapsed.as_millis());
}