use crate::gpu::{
  GpuDevice,
  GpuSeqBuffer,
  GpuMapBuffer,
  shady_vm::{
    bitcode,
    ShadyRegisterFile
  },
};

// The size of the workgroups.
const SHADY_INTERP_WORKGROUP: u32 = 16;

pub(crate) fn shady_interp_command(
  device: &GpuDevice,
  encoder: &mut wgpu::CommandEncoder,
  num_vms: u32,
  num_ins: u32,
  program_buffer: &GpuSeqBuffer<bitcode::Instruction>,
  start_pc_buffer: &GpuSeqBuffer<u32>,
  end_pc_buffer: &GpuSeqBuffer<u32>,
  register_file_buffer: &GpuSeqBuffer<ShadyRegisterFile>,
) {
  // Create the uniform buffer.
  let config_uniforms_u32: [u32; 4] = [ num_vms, num_ins, 0, 0 ];
  let config_uniforms_u8: &[u8] = bytemuck::cast_slice(&config_uniforms_u32);
  let uniform_buffer = device.create_uniform_buffer(
    config_uniforms_u8, Some("ShadyInterp")
  );

  // Load the shader.
  let source = include_str!("./shady_interp.wgsl");
  let shader = device.create_shader_module(source, "ShadyInterp");

  // Create the compute pipeline.
  let compute_pipeline = device.device().create_compute_pipeline(
    &wgpu::ComputePipelineDescriptor {
      label: Some("ShadyInterpPipeline"),
      layout: None,
      module: &shader,
      entry_point: "execute_instructions",
    }
  );

  // Create the bind group.
  let bind_group_layout = compute_pipeline.get_bind_group_layout(0);
  let bind_group = device.device().create_bind_group(
    &wgpu::BindGroupDescriptor {
      label: Some("ShadyInterpBindGroup"),
      layout: &bind_group_layout,
      entries: &[
        wgpu::BindGroupEntry {
          binding: 0,
          resource: uniform_buffer.as_entire_binding(),
        },
        wgpu::BindGroupEntry {
          binding: 1,
          resource: program_buffer.wgpu_buffer().as_entire_binding(),
        },
        wgpu::BindGroupEntry {
          binding: 2,
          resource: start_pc_buffer.wgpu_buffer().as_entire_binding(),
        },
        wgpu::BindGroupEntry {
          binding: 3,
          resource: end_pc_buffer.wgpu_buffer().as_entire_binding(),
        },
        wgpu::BindGroupEntry {
          binding: 4,
          resource: register_file_buffer.wgpu_buffer().as_entire_binding(),
        },
      ],
    }
  );

  // Add the compute pass.
  {
    let mut cpass = encoder.begin_compute_pass(&wgpu::ComputePassDescriptor {
      label: Some("ShadyInterpComputePass"),
    });
    cpass.set_pipeline(&compute_pipeline);
    cpass.set_bind_group(0, &bind_group, &[]);

    let dispatch_x =
      (num_vms + (SHADY_INTERP_WORKGROUP - 1)) / SHADY_INTERP_WORKGROUP;
    cpass.dispatch_workgroups(dispatch_x, 1, 1);
  }
}
