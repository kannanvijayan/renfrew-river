use log;
use wgpu;

use crate::{
  gpu::{
    GpuDevice,
    GpuBufferDataType,
    GpuMapBuffer,
  },
  world::Elevation,
  game::constants::ELEVATION_BITS,
};
use super::commands::minify_elevations_command;

/**
 * Compute a mini-map of elevations
 */
pub(crate) async fn elevations_minimap(
  device: &GpuDevice,
  src_buffer: &GpuMapBuffer<Elevation>,
  dst_buffer: &GpuMapBuffer<Elevation>,
) {
  debug_assert!(
    std::mem::size_of::<
      <Elevation as GpuBufferDataType>::NativeType
    >() == 2
  );
  debug_assert!(ELEVATION_BITS <= 16);

  // Encode the commands.
  let mut encoder = device.device().create_command_encoder(
    &wgpu::CommandEncoderDescriptor {
      label: Some("MiniElevationsEncoder"),
    }
  );

  minify_elevations_command(device, &mut encoder, src_buffer, dst_buffer);

  // Submit the commands.
  let submission_index = device.queue().submit(Some(encoder.finish()));

  let prior_time = std::time::Instant::now();

  // Wait for the commands to finish.
  device.device().poll(wgpu::Maintain::WaitForSubmissionIndex(submission_index));

  let elapsed = prior_time.elapsed();
  log::info!("mini_elevations(elapsed_ms={})", elapsed.as_millis());
}

