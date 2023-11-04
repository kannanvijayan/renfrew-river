use bytemuck;
use crate::{
  game::constants::ELEVATION_BITS,
  gpu::{
    GpuDevice,
    GpuBufferDataType,
    GpuMapBuffer,
  },
  world::Elevation,
};

// The size of the workgroups.
const WORKGROUP_X: u32 = 8;
const WORKGROUP_Y: u32 = 8;

/**
 * Initialize an elevation map.
 */
pub(crate) fn init_elevations_command(
  device: &GpuDevice,
  encoder: &mut wgpu::CommandEncoder,
  rand_seed: u32,
  target_buffer: &GpuMapBuffer<Elevation>,
) {
  debug_assert!(
    std::mem::size_of::<<Elevation as GpuBufferDataType>::NativeType>() == 2
  );
  debug_assert!(ELEVATION_BITS <= 16);

  let world_dims = target_buffer.dims();
  let world_columns = world_dims.columns_u32();
  let world_rows = world_dims.rows_u32();

  // Create the uniform buffer.
  let config_uniforms_u32: [u32; 4] = [
    world_columns, world_rows,
    rand_seed,
    ELEVATION_BITS as u32
  ];
  let config_uniforms_u8: &[u8] = bytemuck::cast_slice(&config_uniforms_u32);
  let uniform_buffer = device.create_uniform_buffer(
    config_uniforms_u8, Some("InitializeElevationsUniforms")
  );

  // Load the shader.
  let source = include_str!("./init_elevations.wgsl");
  let shader = device.create_shader_module(source, "elevation.wgsl");

  // Create the compute pipeline.
  let compute_pipeline = device.device().create_compute_pipeline(
    &wgpu::ComputePipelineDescriptor {
      label: Some("InitializeElevationsPipeline"),
      layout: None,
      module: &shader,
      entry_point: "init_elevations_u16",
    }
  );

  // Create the bind group.
  let bind_group_layout = compute_pipeline.get_bind_group_layout(0);
  let bind_group = device.device().create_bind_group(
    &wgpu::BindGroupDescriptor {
      label: Some("InitializeElevationsBindGroup"),
      layout: &bind_group_layout,
      entries: &[
        wgpu::BindGroupEntry {
          binding: 0,
          resource: uniform_buffer.as_entire_binding(),
        },
        wgpu::BindGroupEntry {
          binding: 1,
          resource: target_buffer.wgpu_buffer().as_entire_binding()
        },
      ],
    }
  );

  // Run the compute pass.
  {
    let mut cpass = encoder.begin_compute_pass(&wgpu::ComputePassDescriptor {
      label: Some("InitializeElevationsComputePass"),
    });
    cpass.set_pipeline(&compute_pipeline);
    cpass.set_bind_group(0, &bind_group, &[]);

    // Since the target buffer is u16, and the shader language only lets
    // us write u32, we use a single shader invocation to compute 2 values
    // at a time.
    debug_assert!(
      std::mem::size_of::<<Elevation as GpuBufferDataType>::NativeType>() == 2
    );
    debug_assert!(ELEVATION_BITS <= 16);
    let dispatch_x = (world_columns + (2*WORKGROUP_X - 1)) / (2*WORKGROUP_X);
    let dispatch_y = (world_rows + WORKGROUP_Y - 1) / WORKGROUP_Y;
    cpass.dispatch_workgroups(dispatch_x, dispatch_y, 1);
  }
}