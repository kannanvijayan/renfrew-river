use crate::{
  game::constants,
  world::WorldDims,
  gpu::{
    GpuDevice,
    GpuSeqBuffer,
    GpuMapBuffer,
    GpuBufferOptions,
    world::{ GpuAnimalsList, GpuAnimalsMap },
  },
  persist::AnimalPersist,
};

// The size of the workgroups.
const RESTORE_ANIMAL_STATE_WORKGROUP: u32 = 64;

pub(crate) fn restore_animal_state_command(
  device: &GpuDevice,
  encoder: &mut wgpu::CommandEncoder,
  world_dims: WorldDims,
  animals_list_persist_buffer: &GpuSeqBuffer<AnimalPersist>,
  out_animals_list: &GpuAnimalsList,
  out_animals_map: &GpuAnimalsMap,
) {
  let world_columns = world_dims.columns_u32();
  let world_rows = world_dims.rows_u32();
  let num_persisted_animals = animals_list_persist_buffer.length() as u32;

  // Create the uniform buffer.
  let config_uniforms_u32: [u32; 4] = [
    world_columns, world_rows,
    constants::MAX_ANIMALS as u32,
    num_persisted_animals,
  ];
  let config_uniforms_u8: &[u8] = bytemuck::cast_slice(&config_uniforms_u32);
  let uniform_buffer = device.create_uniform_buffer(
    config_uniforms_u8, Some("RestoreAnimalStateUniforms")
  );

  // Load the shader.
  let source = include_str!("./restore_animal_state.wgsl");
  let shader = device.create_shader_module(source, "RestoreAnimalStateShader");

  // Create the compute pipeline.
  let compute_pipeline = device.device().create_compute_pipeline(
    &wgpu::ComputePipelineDescriptor {
      label: Some("RestoreAnimalStatePipeline"),
      layout: None,
      module: &shader,
      entry_point: "restore_animal_state",
    }
  );

  // Create the bind group.
  let bind_group_layout = compute_pipeline.get_bind_group_layout(0);
  let bind_group = device.device().create_bind_group(
    &wgpu::BindGroupDescriptor {
      label: Some("RestoreAnimalStateBindGroup"),
      layout: &bind_group_layout,
      entries: &[
        wgpu::BindGroupEntry {
          binding: 0,
          resource: uniform_buffer.as_entire_binding(),
        },
        wgpu::BindGroupEntry {
          binding: 1,
          resource: animals_list_persist_buffer.wgpu_buffer().as_entire_binding(),
        },
        wgpu::BindGroupEntry {
          binding: 2,
          resource: out_animals_list.buffer().wgpu_buffer().as_entire_binding(),
        },
        wgpu::BindGroupEntry {
          binding: 3,
          resource: out_animals_map.buffer().wgpu_buffer().as_entire_binding(),
        },
      ],
    }
  );

  // Run the compute pass.
  {
    let mut cpass = encoder.begin_compute_pass(&wgpu::ComputePassDescriptor {
      label: Some("RestoreAnimalStateComputePass"),
    });
    cpass.set_pipeline(&compute_pipeline);
    cpass.set_bind_group(0, &bind_group, &[]);

    let dispatch_x =
      (num_persisted_animals + (RESTORE_ANIMAL_STATE_WORKGROUP - 1))
        / RESTORE_ANIMAL_STATE_WORKGROUP;
    cpass.dispatch_workgroups(dispatch_x, 1, 1);
  }
}
