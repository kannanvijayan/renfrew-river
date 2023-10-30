use bytemuck;
use log;

use crate::{
  gpu::{
    GpuDevice,
    GpuBufferDataType,
    GpuBufferNativeType,
    GpuMapBuffer,
    GpuBufferOptions
  },
  world::{ WorldDims, TerrainElevation, TERRAIN_ELEVATION_BITS },
};

// The size of the workgroups.
const WORKGROUP_X: u32 = 8;
const WORKGROUP_Y: u32 = 8;

/** The configuration for the terrain generator.  */
#[derive(Clone, Debug)]
pub(crate) struct InitializeElevationsParams {
  pub(crate) world_dims: WorldDims,
  pub(crate) seed: u32,
}

/**
 * Initialize an elevation map.
 */
pub(crate) async fn initialize_elevations(
  device: &GpuDevice,
  params: InitializeElevationsParams,
  target_buffer: &GpuMapBuffer<TerrainElevation>
) {
  debug_assert!(
    std::mem::size_of::<
      <TerrainElevation as GpuBufferDataType>::NativeType
    >() == 2
  );
  debug_assert!(TERRAIN_ELEVATION_BITS <= 16);

  let world_columns = params.world_dims.columns_u32();
  let world_rows = params.world_dims.rows_u32();

  let prior_time = std::time::Instant::now();

  // Create the uniform buffer.
  let config_uniforms_u32: [u32; 4] = [
    world_columns, world_rows,
    params.seed,
    TERRAIN_ELEVATION_BITS as u32
  ];
  let config_uniforms_u8: &[u8] = bytemuck::cast_slice(&config_uniforms_u32);
  let uniform_buffer = device.create_uniform_buffer(
    config_uniforms_u8, Some("InitializeElevationsUniforms")
  );

  // Load the shader.
  let source = include_str!("./wgsl/elevation.wgsl");
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

  // Encode the commands.
  let mut encoder = device.device().create_command_encoder(
    &wgpu::CommandEncoderDescriptor {
      label: Some("InitializeElevationsEncoder"),
    }
  );

  log::info!("Begin compute pass");
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
      std::mem::size_of::<
        <TerrainElevation as GpuBufferDataType>::NativeType
      >() == 2
    );
    debug_assert!(TERRAIN_ELEVATION_BITS <= 16);
    let dispatch_x = (world_columns + (2*WORKGROUP_X - 1)) / (2*WORKGROUP_X);
    let dispatch_y = (world_rows + WORKGROUP_Y - 1) / WORKGROUP_Y;
    cpass.dispatch_workgroups(dispatch_x, dispatch_y, 1);
  }

  // Submit the commands.
  let submission_index = device.queue().submit(Some(encoder.finish()));

  // Wait for the commands to finish.
  device.device().poll(wgpu::Maintain::WaitForSubmissionIndex(submission_index));

  let elapsed = prior_time.elapsed();
  log::info!("initialize_elevations(elapsed_ms={})", elapsed.as_millis());
}

/**
 * Compute a mini-map of elevations
 */
pub(crate) async fn mini_elevations(
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

  let src_dims = src_buffer.dims();
  let src_columns = src_dims.columns_u32();
  let src_rows = src_dims.rows_u32();

  let mid_buffer = GpuMapBuffer::<TerrainElevation>::new(
    device,
    dst_buffer.dims(),
    GpuBufferOptions::empty()
      .with_label("MiniElevationsMidBuffer")
      .with_storage(true)
      .with_copy_src(true)
  );

  let dst_dims = dst_buffer.dims();
  let dst_columns = dst_dims.columns_u32();
  let dst_rows = dst_dims.rows_u32();

  let prior_time = std::time::Instant::now();

  // Create the uniform buffer.
  let config_uniforms_u32: [u32; 6] = [
    src_columns, src_rows,
    dst_columns, dst_rows,
    TERRAIN_ELEVATION_BITS as u32,
    0,
  ];
  let config_uniforms_u8: &[u8] = bytemuck::cast_slice(&config_uniforms_u32);
  let uniform_buffer = device.create_uniform_buffer(
    config_uniforms_u8, Some("MiniElevationsUniforms")
  );

  // Load the shader.
  let source = include_str!("./wgsl/elevations_mini.wgsl");
  let shader = device.create_shader_module(source, "elevations_mini.wgsl");

  // Create the compute pipeline.
  let compute_pipeline = device.device().create_compute_pipeline(
    &wgpu::ComputePipelineDescriptor {
      label: Some("MiniElevationsPipeline"),
      layout: None,
      module: &shader,
      entry_point: "mini_elevations_u16",
    }
  );

  // Create the bind group.
  let bind_group_layout = compute_pipeline.get_bind_group_layout(0);
  let bind_group = device.device().create_bind_group(
    &wgpu::BindGroupDescriptor {
      label: Some("MiniElevationsBindGroup"),
      layout: &bind_group_layout,
      entries: &[
        wgpu::BindGroupEntry {
          binding: 0,
          resource: uniform_buffer.as_entire_binding(),
        },
        wgpu::BindGroupEntry {
          binding: 1,
          resource: src_buffer.wgpu_buffer().as_entire_binding()
        },
        wgpu::BindGroupEntry {
          binding: 2,
          resource: mid_buffer.wgpu_buffer().as_entire_binding()
        },
      ],
    }
  );

  // Encode the commands.
  let mut encoder = device.device().create_command_encoder(
    &wgpu::CommandEncoderDescriptor {
      label: Some("MiniElevationsEncoder"),
    }
  );

  log::info!("Begin compute pass");
  // Compute the minimap values.
  {
    let mut cpass = encoder.begin_compute_pass(&wgpu::ComputePassDescriptor {
      label: Some("TerrainGeneratorComputePass"),
    });
    cpass.set_pipeline(&compute_pipeline);
    cpass.set_bind_group(0, &bind_group, &[]);

    // Since the target buffer is u16, and the shader language only lets
    // us write u32, we use a single shader invocation to compute 2 values
    // at a time.
    debug_assert!(
      std::mem::size_of::<
        <TerrainElevation as GpuBufferDataType>::NativeType
      >() == 2
    );
    debug_assert!(TERRAIN_ELEVATION_BITS <= 16);
    let dispatch_x = (dst_columns + (2*WORKGROUP_X - 1)) / (2*WORKGROUP_X);
    let dispatch_y = (dst_rows + WORKGROUP_Y - 1) / WORKGROUP_Y;
    cpass.dispatch_workgroups(dispatch_x, dispatch_y, 1);
  }

  // Copy the mid-buffer to the destination buffer.
  {
    let size =
      dst_dims.columns_u64() *
      dst_dims.rows_u64() *
      <TerrainElevation as GpuBufferDataType>::NativeType::SIZE as u64;
    encoder.copy_buffer_to_buffer(
      &mid_buffer.wgpu_buffer(), 0,
      &dst_buffer.wgpu_buffer(), 0,
      size,
    );
  }

  // Submit the commands.
  let submission_index = device.queue().submit(Some(encoder.finish()));

  // Wait for the commands to finish.
  device.device().poll(wgpu::Maintain::WaitForSubmissionIndex(submission_index));

  let elapsed = prior_time.elapsed();
  log::info!("mini_elevations(elapsed_ms={})", elapsed.as_millis());
}