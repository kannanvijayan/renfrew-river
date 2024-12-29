use crate::gpu::{
  GpuDevice,
  GpuSeqBuffer,
  GpuMapBuffer,
  GpuBufferOptions,
  shady_vm::{
    bitcode,
    ShadyRegisterFile
  },
};
use super::commands::shady_interp_command;

#[derive(Debug, Clone, Copy)]
pub(crate) struct VmInterpretInfo {
  pub program_start_pc: u32,
}

pub(crate) async fn shady_interpret(
  device: &GpuDevice,
  program_buffer: &GpuSeqBuffer<bitcode::Instruction>,
  vms_info: Vec<VmInterpretInfo>,
  register_file_buffer: &GpuSeqBuffer<ShadyRegisterFile>,
) {
  let mut encoder = device.device().create_command_encoder(
    &wgpu::CommandEncoderDescriptor {
      label: Some("ShadyInterpEncoder"),
    }
  );

  // Allocate and initialize the start_pc buffer.
  let start_pc_buffer = GpuSeqBuffer::<u32>::new(
    device,
    vms_info.len(),
    GpuBufferOptions::empty()
      .with_copy_dst(true)
      .with_storage(true),
  );

  start_pc_buffer.write_iter_staged(
    device,
    0,
    vms_info.iter().map(|info| &info.program_start_pc)
  );

  // Allocate the end_pc buffer.
  let end_pc_buffer = GpuSeqBuffer::<u32>::new(
    device,
    vms_info.len(),
    GpuBufferOptions::empty()
      .with_storage(true)
      .with_copy_src(true),
  );

  shady_interp_command(
    device,
    &mut encoder,
    vms_info.len() as u32,
    1,
    program_buffer,
    &start_pc_buffer,
    &end_pc_buffer,
    register_file_buffer,
  );

  let prior_time = std::time::Instant::now();

  // Submit the command & wait for finish.
  let submission_index = device.queue().submit(Some(encoder.finish()));
  device.device().poll(wgpu::Maintain::WaitForSubmissionIndex(submission_index));

  let elapsed = prior_time.elapsed();
  log::info!("shady_interp(elapsed_ms={})", elapsed.as_millis());
  eprintln!("shady_interp(elapsed_ms={})", elapsed.as_millis());
}
