use log;
use crate::{
  gpu::{
    GpuDevice,
    GpuBufferDataType,
    GpuMapBuffer,
  },
  world::{ TerrainElevation, TERRAIN_ELEVATION_BITS },
};
use super::init_elevations::init_elevations_command;

/**
 * Initialize an elevation map.
 */
pub(crate) async fn initialize_elevations(
  device: &GpuDevice,
  seed: u32,
  target_buffer: &GpuMapBuffer<TerrainElevation>
) {
  debug_assert!(
    std::mem::size_of::<
      <TerrainElevation as GpuBufferDataType>::NativeType
    >() == 2
  );
  debug_assert!(TERRAIN_ELEVATION_BITS <= 16);

  // Encode the commands.
  let mut encoder = device.device().create_command_encoder(
    &wgpu::CommandEncoderDescriptor {
      label: Some("InitializeElevationsEncoder"),
    }
  );

  init_elevations_command(device, &mut encoder, seed, target_buffer);

  let prior_time = std::time::Instant::now();

  // Submit the commands.
  let submission_index = device.queue().submit(Some(encoder.finish()));

  // Wait for the commands to finish.
  device.device().poll(wgpu::Maintain::WaitForSubmissionIndex(submission_index));

  let elapsed = prior_time.elapsed();
  log::info!("initialize_elevations(elapsed_ms={})", elapsed.as_millis());
}