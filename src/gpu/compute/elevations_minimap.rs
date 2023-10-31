use log;
use wgpu;

use crate::{
  gpu::{
    GpuDevice,
    GpuBufferDataType,
    GpuMapBuffer,
  },
  world::{ TerrainElevation, TERRAIN_ELEVATION_BITS },
};
use super::minify_elevations::mini_elevations_command;

/**
 * Compute a mini-map of elevations
 */
pub(crate) async fn elevations_minimap(
  device: &GpuDevice,
  src_buffer: &GpuMapBuffer<TerrainElevation>,
  dst_buffer: &GpuMapBuffer<TerrainElevation>,
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
      label: Some("MiniElevationsEncoder"),
    }
  );

  mini_elevations_command(device, &mut encoder, src_buffer, dst_buffer);

  // Submit the commands.
  let submission_index = device.queue().submit(Some(encoder.finish()));

  let prior_time = std::time::Instant::now();

  // Wait for the commands to finish.
  device.device().poll(wgpu::Maintain::WaitForSubmissionIndex(submission_index));

  let elapsed = prior_time.elapsed();
  log::info!("mini_elevations(elapsed_ms={})", elapsed.as_millis());
}
