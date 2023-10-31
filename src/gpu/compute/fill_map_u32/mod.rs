use crate::gpu::{ GpuDevice, GpuMapBuffer };

const FILL_MAP_U32_WORKGROUP_X: u32 = 8;
const FILL_MAP_U32_WORKGROUP_Y: u32 = 8;

pub(crate) fn fill_map_u32_command(
  device: &GpuDevice,
  encoder: &mut wgpu::CommandEncoder,
  animals_map_buffer: &GpuMapBuffer<u32>,
  value: u32,
) {
  let world_dims = animals_map_buffer.dims();
  let world_columns = world_dims.columns_u32();
  let world_rows = world_dims.rows_u32();

  // Create the uniform buffer.
  let config_uniforms_u32: [u32; 4] = [
    world_columns, world_rows,
    value, 0
  ];
  let config_uniforms_u8: &[u8] = bytemuck::cast_slice(&config_uniforms_u32);
  let uniform_buffer = device.create_uniform_buffer(
    config_uniforms_u8, Some("FillAnimalsMapUniforms")
  );

  // Load the shader.
  let source = include_str!("./fill_map_u32.wgsl");
  let shader = device.create_shader_module(source, "FillAnimalsMapShader");

  // Create the compute pipeline.
  let compute_pipeline = device.device().create_compute_pipeline(
    &wgpu::ComputePipelineDescriptor {
      label: Some("FillAnimalsMapPipeline"),
      layout: None,
      module: &shader,
      entry_point: "fill_map_u32",
    }
  );

  // Create the bind group.
  let bind_group_layout = compute_pipeline.get_bind_group_layout(0);
  let bind_group = device.device().create_bind_group(
    &wgpu::BindGroupDescriptor {
      label: Some("FillAnimalsMapBindGroup"),
      layout: &bind_group_layout,
      entries: &[
        wgpu::BindGroupEntry {
          binding: 0,
          resource: uniform_buffer.as_entire_binding(),
        },
        wgpu::BindGroupEntry {
          binding: 1,
          resource: animals_map_buffer.wgpu_buffer().as_entire_binding(),
        },
      ],
    }
  );

  // Run the compute pass.
  {
    let mut cpass = encoder.begin_compute_pass(&wgpu::ComputePassDescriptor {
      label: Some("FillAnimalsMapComputePass"),
    });
    cpass.set_pipeline(&compute_pipeline);
    cpass.set_bind_group(0, &bind_group, &[]);

    let dispatch_x =
      (world_dims.columns_u32() + (FILL_MAP_U32_WORKGROUP_X - 1))
        / FILL_MAP_U32_WORKGROUP_X;
    let dispatch_y =
      (world_dims.rows_u32() + (FILL_MAP_U32_WORKGROUP_Y - 1))
        / FILL_MAP_U32_WORKGROUP_Y;
    cpass.dispatch_workgroups(dispatch_x, dispatch_y, 1);
  }
}
