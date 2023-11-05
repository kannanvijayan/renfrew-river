use crate::{
  world::{ AnimalId, AnimalData, CellCoord },
  gpu::{ GpuDevice, GpuSeqBuffer, GpuMapBuffer }
};

// The size of the workgroups.
const APPLY_ANIMAL_MOVES_WORKGROUP: u32 = 64;

pub(crate) fn apply_animal_moves_command(
  device: &GpuDevice,
  encoder: &mut wgpu::CommandEncoder,
  target_positions_buffer: &GpuSeqBuffer<CellCoord>,
  conflicts_map_buffer: &GpuMapBuffer<AnimalId>,
  animals_list_buffer: &GpuSeqBuffer<AnimalData>,
  animal_position_map_buffer: &GpuMapBuffer<AnimalId>,
) {
  let world_dims = conflicts_map_buffer.dims();
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
    config_uniforms_u8, Some("ApplyAnimalMovesUniforms")
  );

  // Load the shader.
  let source = include_str!("./apply_animal_moves.wgsl");
  let shader = device.create_shader_module(source, "ApplyAnimalMovesShader");

  // Create the compute pipeline.
  let compute_pipeline = device.device().create_compute_pipeline(
    &wgpu::ComputePipelineDescriptor {
      label: Some("ApplyAnimalMovesPipeline"),
      layout: None,
      module: &shader,
      entry_point: "resolve_animal_moves",
    }
  );

  // Create the bind group.
  let bind_group_layout = compute_pipeline.get_bind_group_layout(0);
  let bind_group = device.device().create_bind_group(
    &wgpu::BindGroupDescriptor {
      label: Some("ApplyAnimalMovesBindGroup"),
      layout: &bind_group_layout,
      entries: &[
        wgpu::BindGroupEntry {
          binding: 0,
          resource: uniform_buffer.as_entire_binding(),
        },
        wgpu::BindGroupEntry {
          binding: 1,
          resource: target_positions_buffer.wgpu_buffer().as_entire_binding(),
        },
        wgpu::BindGroupEntry {
          binding: 2,
          resource: conflicts_map_buffer.wgpu_buffer().as_entire_binding(),
        },
        wgpu::BindGroupEntry {
          binding: 3,
          resource: animals_list_buffer.wgpu_buffer().as_entire_binding(),
        },
        wgpu::BindGroupEntry {
          binding: 4,
          resource: animal_position_map_buffer.wgpu_buffer().as_entire_binding(),
        },
      ],
    }
  );

  // Add the compute pass.
  {
    let mut cpass = encoder.begin_compute_pass(&wgpu::ComputePassDescriptor {
      label: Some("ApplyAnimalMovesComputePass"),
    });
    cpass.set_pipeline(&compute_pipeline);
    cpass.set_bind_group(0, &bind_group, &[]);

    let dispatch_x =
      (num_animals + (APPLY_ANIMAL_MOVES_WORKGROUP - 1))
        / APPLY_ANIMAL_MOVES_WORKGROUP;
    cpass.dispatch_workgroups(dispatch_x, 1, 1);
  }
}
