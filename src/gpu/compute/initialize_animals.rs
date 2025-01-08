use crate::{
  world::{ AnimalId, AnimalData },
  gpu::{
    GpuDevice,
    GpuSeqBuffer,
    GpuMapBuffer,
    world::{ GpuAnimalsList, GpuAnimalsMap },
  }
};
use super::commands::{ fill_map_u32_command, init_animals_command };

/**
 * Initialize animals.
 */
pub(crate) async fn initialize_animals(
  device: &GpuDevice,
  rand_seed: u32,
  animals_list: &GpuAnimalsList,
  animals_map: &GpuAnimalsMap,
) {

  let mut encoder = device.device().create_command_encoder(
    &wgpu::CommandEncoderDescriptor {
      label: Some("InitializeAnimalsEncoder"),
    }
  );

  fill_map_u32_command(
    device,
    &mut encoder,
    animals_map.buffer().cast_as_native_type(),
    AnimalId::INVALID.to_u32()
  );

  init_animals_command(
    device,
    &mut encoder,
    rand_seed,
    animals_list.buffer(),
    animals_map.buffer(),
  );

  let prior_time = std::time::Instant::now();

  // Submit the commands.
  let submission_index = device.queue().submit(Some(encoder.finish()));

  // Wait for the commands to finish.
  device.device().poll(wgpu::Maintain::WaitForSubmissionIndex(submission_index));

  let elapsed = prior_time.elapsed();
  log::info!("initialize_animals(elapsed_ms={})", elapsed.as_millis());
}
