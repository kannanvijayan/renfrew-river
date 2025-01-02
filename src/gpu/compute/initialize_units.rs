use std::mem;
use crate::{
  world::UnitData,
  gpu::{ GpuDevice, GpuSeqBuffer, GpuBufferDataType }
};
use super::commands::fill_u32_command;

/**
 * Initialize animals.
 */
pub(crate) async fn initialize_units(
  device: &GpuDevice,
  unit_data_buffer: &GpuSeqBuffer<UnitData>,
) {

  let mut encoder = device.device().create_command_encoder(
    &wgpu::CommandEncoderDescriptor {
      label: Some("InitializeAnimalsEncoder"),
    }
  );

  fill_u32_command(
    device,
    &mut encoder,
    unit_data_buffer.wgpu_buffer(),
    0,
    unit_data_buffer.wgpu_buffer().size() as usize / 4,
    u32::max_value(),
  );

  let prior_time = std::time::Instant::now();

  // Submit the commands.
  let submission_index = device.queue().submit(Some(encoder.finish()));

  // Wait for the commands to finish.
  device.device().poll(wgpu::Maintain::WaitForSubmissionIndex(submission_index));

  let elapsed = prior_time.elapsed();
  log::info!("initialize_units(elapsed_ms={})", elapsed.as_millis());
}
