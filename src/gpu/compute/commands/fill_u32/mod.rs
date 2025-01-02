use crate::gpu::{ GpuDevice, GpuMapBuffer, GpuSeqBuffer };

const FILL_U32_WORKGROUP: usize = 64;
const NUM_SEGMENTS: usize = 4096;

pub(crate) fn fill_u32_command(
  device: &GpuDevice,
  encoder: &mut wgpu::CommandEncoder,
  out_buffer: &wgpu::Buffer,
  offset: usize,
  size: usize,
  value: u32,
) {
  // Create the uniform buffer.
  let config_uniforms_u32: [u32; 4] = [
    offset as u32,
    size as u32,
    NUM_SEGMENTS as u32,
    value,
  ];
  let config_uniforms_u8: &[u8] = bytemuck::cast_slice(&config_uniforms_u32);
  let uniform_buffer = device.create_uniform_buffer(
    config_uniforms_u8, Some("FillU32Uniforms")
  );

  // Load the shader.
  let source = include_str!("./fill_u32.wgsl");
  let shader = device.create_shader_module(source, "FillU32Shader");

  // Create the compute pipeline.
  let compute_pipeline = device.device().create_compute_pipeline(
    &wgpu::ComputePipelineDescriptor {
      label: Some("FillU32Pipeline"),
      layout: None,
      module: &shader,
      entry_point: "fill_u32",
    }
  );

  // Create the bind group.
  let bind_group_layout = compute_pipeline.get_bind_group_layout(0);
  let bind_group = device.device().create_bind_group(
    &wgpu::BindGroupDescriptor {
      label: Some("FillU32BindGroup"),
      layout: &bind_group_layout,
      entries: &[
        wgpu::BindGroupEntry {
          binding: 0,
          resource: uniform_buffer.as_entire_binding(),
        },
        wgpu::BindGroupEntry {
          binding: 1,
          resource: out_buffer.as_entire_binding(),
        },
      ],
    }
  );

  // Run the compute pass.
  {
    let mut cpass = encoder.begin_compute_pass(&wgpu::ComputePassDescriptor {
      label: Some("FillU32ComputePass"),
    });
    cpass.set_pipeline(&compute_pipeline);
    cpass.set_bind_group(0, &bind_group, &[]);

    let dispatch_x = NUM_SEGMENTS.div_ceil(FILL_U32_WORKGROUP);
    cpass.dispatch_workgroups(dispatch_x as u32, 1, 1);
  }
}

pub(crate) fn fill_map_u32_command(
  device: &GpuDevice,
  encoder: &mut wgpu::CommandEncoder,
  out_buffer: &GpuMapBuffer<u32>,
  value: u32,
) {
  let size = out_buffer.dims().area() as usize;
  fill_u32_command(device, encoder, out_buffer.wgpu_buffer(), 0, size, value);
}


pub(crate) fn fill_seq_u32_command(
  device: &GpuDevice,
  encoder: &mut wgpu::CommandEncoder,
  out_buffer: &GpuSeqBuffer<u32>,
  value: u32,
) {
  let size = out_buffer.length();
  fill_u32_command(device, encoder, out_buffer.wgpu_buffer(), 0, size, value);
}
