use crate::{
  world::{ AnimalData, Elevation, CellCoord },
  gpu::{
    GpuDevice,
    GpuSeqBuffer,
    GpuMapBuffer,
    GpuBufferOptions,
  }
};

// The size of the workgroups.
const LOOK_AND_MOVE_WORKGROUP: u32 = 64;

pub(crate) fn look_and_move_command(
  device: &GpuDevice,
  encoder: &mut wgpu::CommandEncoder,
  elevations_map_buffer: &GpuMapBuffer<Elevation>,
  animals_list_buffer: &GpuSeqBuffer<AnimalData>,
) -> GpuSeqBuffer<CellCoord> {
  let world_dims = elevations_map_buffer.dims();
  let world_columns = world_dims.columns_u32();
  let world_rows = world_dims.rows_u32();
  let num_animals = animals_list_buffer.length() as u32;

  // Create the uniform buffer.
  let config_uniforms_u32: [u32; 4] = [
    world_columns, world_rows,
    num_animals, 0,
  ];
  let config_uniforms_u8: &[u8] = bytemuck::cast_slice(&config_uniforms_u32);
  let uniform_buffer = device.create_uniform_buffer(
    config_uniforms_u8, Some("LookAndMoveUniforms")
  );

  // Create the output buffer.
  let output_buffer = GpuSeqBuffer::<CellCoord>::new(
    device,
    animals_list_buffer.length(),
    GpuBufferOptions::empty()
      .with_label("InitializeAnimalsConflictsMap")
      .with_storage(true)
      .with_copy_src(true),
  );

  // Load the shader.
  let source = include_str!("./look_and_move.wgsl");
  let shader = device.create_shader_module(source, "LookAndMoveShader");

  // Create the compute pipeline.
  let compute_pipeline = device.device().create_compute_pipeline(
    &wgpu::ComputePipelineDescriptor {
      label: Some("LookAndMovePipeline"),
      layout: None,
      module: &shader,
      entry_point: "look_and_move",
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
          resource: elevations_map_buffer.wgpu_buffer().as_entire_binding(),
        },
        wgpu::BindGroupEntry {
          binding: 2,
          resource: animals_list_buffer.wgpu_buffer().as_entire_binding(),
        },
        wgpu::BindGroupEntry {
          binding: 3,
          resource: output_buffer.wgpu_buffer().as_entire_binding(),
        },
      ],
    }
  );

  // Run the compute pass.
  {
    let mut cpass = encoder.begin_compute_pass(&wgpu::ComputePassDescriptor {
      label: Some("LookAndMoveComputePass"),
    });
    cpass.set_pipeline(&compute_pipeline);
    cpass.set_bind_group(0, &bind_group, &[]);

    let dispatch_x =
      (num_animals + (LOOK_AND_MOVE_WORKGROUP - 1)) / LOOK_AND_MOVE_WORKGROUP;
    cpass.dispatch_workgroups(dispatch_x, 1, 1);
  }

  output_buffer
}
