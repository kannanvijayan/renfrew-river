use crate::{
  game::constants,
  world::{
    WorldDims,
    AnimalId,
    AnimalData,
  },
  gpu::{
    GpuDevice,
    GpuSeqBuffer,
    GpuMapBuffer,
    GpuBufferOptions,
  }
};

// The size of the workgroups.
const INIT_ANIMALS_WORKGROUP: u32 = 64;

const FILL_ANIMALS_MAP_WORKGROUP_X: u32 = 8;
const FILL_ANIMALS_MAP_WORKGROUP_Y: u32 = 8;

/** The configuration for the terrain generator.  */
#[derive(Clone, Debug)]
pub(crate) struct InitializeAnimalsParams {
  pub(crate) world_dims: WorldDims,
  pub(crate) rand_seed: u32,
}

/**
 * Initialize animals.
 */
pub(crate) async fn initialize_animals(
  device: &GpuDevice,
  params: InitializeAnimalsParams,
  animals_list_buffer: &GpuSeqBuffer<AnimalData>,
  animals_map_buffer: &GpuMapBuffer<AnimalId>,
) {

  let mut encoder = device.device().create_command_encoder(
    &wgpu::CommandEncoderDescriptor {
      label: Some("InitializeAnimalsEncoder"),
    }
  );

  fill_animals_map_command(
    device,
    &mut encoder,
    animals_map_buffer,
    params.world_dims,
  );

  init_animals_command(
    device,
    &mut encoder,
    animals_list_buffer,
    animals_map_buffer,
    params.world_dims,
    params.rand_seed
  );

  let prior_time = std::time::Instant::now();

  // Submit the commands.
  let submission_index = device.queue().submit(Some(encoder.finish()));

  // Wait for the commands to finish.
  device.device().poll(wgpu::Maintain::WaitForSubmissionIndex(submission_index));

  let elapsed = prior_time.elapsed();
  log::info!("initialize_animals(elapsed_ms={})", elapsed.as_millis());
}

fn fill_animals_map_command(
  device: &GpuDevice,
  encoder: &mut wgpu::CommandEncoder,
  animals_map_buffer: &GpuMapBuffer<AnimalId>,
  world_dims: WorldDims,
) {
  let world_columns = world_dims.columns_u32();
  let world_rows = world_dims.rows_u32();

  // Create the uniform buffer.
  let config_uniforms_u32: [u32; 4] = [
    world_columns, world_rows,
    AnimalId::INVALID.to_u32(), 0
  ];
  let config_uniforms_u8: &[u8] = bytemuck::cast_slice(&config_uniforms_u32);
  let uniform_buffer = device.create_uniform_buffer(
    config_uniforms_u8, Some("FillAnimalsMapUniforms")
  );

  // Create the conflicts buffer.
  let conflicts_buffer = GpuMapBuffer::<u32>::new(
    device,
    world_dims,
    GpuBufferOptions::empty()
      .with_label("FillAnimalsMapConflictsMap")
      .with_storage(true),
  );

  // Load the shader.
  let source = include_str!("./wgsl/fill_map_u32.wgsl");
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
      (world_dims.columns_u32() + (FILL_ANIMALS_MAP_WORKGROUP_X - 1))
        / FILL_ANIMALS_MAP_WORKGROUP_X;
    let dispatch_y =
      (world_dims.rows_u32() + (FILL_ANIMALS_MAP_WORKGROUP_Y - 1))
        / FILL_ANIMALS_MAP_WORKGROUP_Y;
    cpass.dispatch_workgroups(dispatch_x, dispatch_y, 1);
  }
}

fn init_animals_command(
  device: &GpuDevice,
  encoder: &mut wgpu::CommandEncoder,
  animals_list_buffer: &GpuSeqBuffer<AnimalData>,
  animals_map_buffer: &GpuMapBuffer<AnimalId>,
  world_dims: WorldDims,
  rand_seed: u32,
) {
  let world_columns = world_dims.columns_u32();
  let world_rows = world_dims.rows_u32();
  let rand_seed = rand_seed;
  let rand_category = constants::RandGenCategory::InitAnimals.to_u32();
  let num_animals = animals_list_buffer.length() as u32;

  // Create the uniform buffer.
  let config_uniforms_u32: [u32; 6] = [
    world_columns, world_rows,
    rand_seed, rand_category,
    num_animals, 0,
  ];
  let config_uniforms_u8: &[u8] = bytemuck::cast_slice(&config_uniforms_u32);
  let uniform_buffer = device.create_uniform_buffer(
    config_uniforms_u8, Some("InitializeAnimalsUniforms")
  );

  // Create the conflicts buffer.
  let conflicts_buffer = GpuMapBuffer::<u32>::new(
    device,
    world_dims,
    GpuBufferOptions::empty()
      .with_label("InitializeAnimalsConflictsMap")
      .with_storage(true),
  );

  // Load the shader.
  let source = include_str!("./wgsl/init_animals.wgsl");
  let shader = device.create_shader_module(source, "InitializeAnimalsShader");

  // Create the compute pipeline.
  let compute_pipeline = device.device().create_compute_pipeline(
    &wgpu::ComputePipelineDescriptor {
      label: Some("InitializeAnimalsPipeline"),
      layout: None,
      module: &shader,
      entry_point: "init_animals",
    }
  );

  // Create the bind group.
  let bind_group_layout = compute_pipeline.get_bind_group_layout(0);
  let bind_group = device.device().create_bind_group(
    &wgpu::BindGroupDescriptor {
      label: Some("InitializeAnimalsBindGroup"),
      layout: &bind_group_layout,
      entries: &[
        wgpu::BindGroupEntry {
          binding: 0,
          resource: uniform_buffer.as_entire_binding(),
        },
        wgpu::BindGroupEntry {
          binding: 1,
          resource: animals_list_buffer.wgpu_buffer().as_entire_binding(),
        },
        wgpu::BindGroupEntry {
          binding: 2,
          resource: animals_map_buffer.wgpu_buffer().as_entire_binding(),
        },
        wgpu::BindGroupEntry {
          binding: 3,
          resource: conflicts_buffer.wgpu_buffer().as_entire_binding(),
        },
      ],
    }
  );

  // Run the compute pass.
  {
    let mut cpass = encoder.begin_compute_pass(&wgpu::ComputePassDescriptor {
      label: Some("InitializeAnimalsComputePass"),
    });
    cpass.set_pipeline(&compute_pipeline);
    cpass.set_bind_group(0, &bind_group, &[]);

    let dispatch_x =
      (num_animals + (INIT_ANIMALS_WORKGROUP - 1)) / INIT_ANIMALS_WORKGROUP;
    cpass.dispatch_workgroups(dispatch_x, 1, 1);
  }
}