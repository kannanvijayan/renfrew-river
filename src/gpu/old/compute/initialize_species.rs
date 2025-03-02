use crate::{
  gpu::{
    GpuDevice,
    GpuSeqBuffer,
    ShadyProgramIndex,
    world::GpuSpeciesList,
  },
  world::SpeciesData,
};
use super::commands::fill_seq_u32_command;

/**
 * Initialize species.
 */
pub(crate) async fn initialize_species(
  device: &GpuDevice,
  species_list: &GpuSpeciesList,
) {

  let mut encoder = device.device().create_command_encoder(
    &wgpu::CommandEncoderDescriptor {
      label: Some("InitializeSpeciesEncoder"),
    }
  );

  fill_seq_u32_command(
    device,
    &mut encoder,
    species_list.buffer().cast_as_native_type(),
    ShadyProgramIndex::INVALID.to_u32(),
  );

  let prior_time = std::time::Instant::now();

  // Submit the commands.
  let submission_index = device.queue().submit(Some(encoder.finish()));

  // Wait for the commands to finish.
  device.device().poll(wgpu::Maintain::WaitForSubmissionIndex(submission_index));

  let elapsed = prior_time.elapsed();
  log::info!("initialize_species(elapsed_ms={})", elapsed.as_millis());
}
