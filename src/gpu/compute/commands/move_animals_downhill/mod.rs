use crate::{
  gpu::{
    GpuBufferOptions,
    GpuDevice,
    GpuMapBuffer,
    GpuSeqBuffer,
    ShadyProgramIndex,
    ShadyRegisterFile,
  },
  world::{ AnimalData, CellCoord, Elevation, WorldDims }
};

// The size of the workgroups.
const MOVE_ANIMALS_DOWNHILL_WORKGROUP: u32 = 64;

const FILL_REGISTERS_WORKGROUP: u32 = 64;
const READOUT_REGISTERS_WORKGROUP: u32 = 64;

pub(crate) fn move_animals_downhill_command(
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
    config_uniforms_u8, Some("MoveAnimalsDownhillUniforms")
  );

  // Create the output buffer.
  let output_buffer = GpuSeqBuffer::<CellCoord>::new(
    device,
    animals_list_buffer.length(),
    GpuBufferOptions::empty()
      .with_label("MoveAnimalsDownhillComputedTargets")
      .with_storage(true)
      .with_copy_src(true),
  );

  // Load the shader.
  let source = include_str!("./move_animals_downhill.wgsl");
  let shader = device.create_shader_module(source, "MoveAnimalsDownhillShader");

  // Create the compute pipeline.
  let compute_pipeline = device.device().create_compute_pipeline(
    &wgpu::ComputePipelineDescriptor {
      label: Some("MoveAnimalsDownhillPipeline"),
      layout: None,
      module: &shader,
      entry_point: "move_animals_downhill",
    }
  );

  // Create the bind group.
  let bind_group_layout = compute_pipeline.get_bind_group_layout(0);
  let bind_group = device.device().create_bind_group(
    &wgpu::BindGroupDescriptor {
      label: Some("MoveAnimalsDownhillBindGroup"),
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

  // Add the compute pass.
  {
    let mut cpass = encoder.begin_compute_pass(&wgpu::ComputePassDescriptor {
      label: Some("MoveAnimalsDownhillComputePass"),
    });
    cpass.set_pipeline(&compute_pipeline);
    cpass.set_bind_group(0, &bind_group, &[]);

    let dispatch_x =
      (num_animals + (MOVE_ANIMALS_DOWNHILL_WORKGROUP - 1))
        / MOVE_ANIMALS_DOWNHILL_WORKGROUP;
    cpass.dispatch_workgroups(dispatch_x, 1, 1);
  }

  output_buffer
}

pub(crate) fn fill_registers_for_animal_move(
  device: &GpuDevice,
  encoder: &mut wgpu::CommandEncoder,
  elevations_map_buffer: &GpuMapBuffer<Elevation>,
  animals_list_buffer: &GpuSeqBuffer<AnimalData>,
  start_pc: ShadyProgramIndex,
  start_pc_buffer: &GpuSeqBuffer<u32>,
) -> GpuSeqBuffer<ShadyRegisterFile> {
  let world_dims = elevations_map_buffer.dims();
  let world_columns = world_dims.columns_u32();
  let world_rows = world_dims.rows_u32();
  let num_animals = animals_list_buffer.length() as u32;

  // Create the uniform buffer.
  let config_uniforms_u32: [u32; 4] = [
    world_columns, world_rows,
    num_animals, start_pc.offset,
  ];
  let config_uniforms_u8: &[u8] = bytemuck::cast_slice(&config_uniforms_u32);
  let uniform_buffer = device.create_uniform_buffer(
    config_uniforms_u8, Some("FillRegistersForAnimalMoveUniforms")
  );

  // Create the output buffer.
  let output_buffer = GpuSeqBuffer::<ShadyRegisterFile>::new(
    device,
    animals_list_buffer.length(),
    GpuBufferOptions::empty()
      .with_label("FillRegistersForAnimalMoveComputedTargets")
      .with_storage(true)
      .with_copy_src(true),
  );

  // Load the shader.
  let source = include_str!("./fill_registers_for_animal_move.wgsl");
  let shader = device.create_shader_module(source, "FillRegistersForAnimalMoveShader");

  // Create the compute pipeline.
  let compute_pipeline = device.device().create_compute_pipeline(
    &wgpu::ComputePipelineDescriptor {
      label: Some("FillRegistersForAnimalMovePipeline"),
      layout: None,
      module: &shader,
      entry_point: "fill_registers",
    }
  );

  // Create the bind group.
  let bind_group_layout = compute_pipeline.get_bind_group_layout(0);
  let bind_group = device.device().create_bind_group(
    &wgpu::BindGroupDescriptor {
      label: Some("FillRegistersForAnimalMoveBindGroup"),
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
        wgpu::BindGroupEntry {
          binding: 4,
          resource: start_pc_buffer.wgpu_buffer().as_entire_binding(),
        },
      ],
    }
  );

  // Add the compute pass.
  {
    let mut cpass = encoder.begin_compute_pass(&wgpu::ComputePassDescriptor {
      label: Some("FillRegistersForAnimalMoveComputePass"),
    });
    cpass.set_pipeline(&compute_pipeline);
    cpass.set_bind_group(0, &bind_group, &[]);

    let dispatch_x =
      (num_animals + (FILL_REGISTERS_WORKGROUP - 1))
        / FILL_REGISTERS_WORKGROUP;
    cpass.dispatch_workgroups(dispatch_x, 1, 1);
  }

  output_buffer
}

pub(crate) fn readout_registers_for_animal_move(
  device: &GpuDevice,
  encoder: &mut wgpu::CommandEncoder,
  world_dims: WorldDims,
  animals_list_buffer: &GpuSeqBuffer<AnimalData>,
  start_pc_buffer: &GpuSeqBuffer<u32>,
  register_file_buffer: &GpuSeqBuffer<ShadyRegisterFile>,
) -> GpuSeqBuffer<CellCoord> {
  let world_columns = world_dims.columns_u32();
  let world_rows = world_dims.rows_u32();

  let num_vms = register_file_buffer.length() as u32;

  // Create the uniform buffer.
  let config_uniforms_u32: [u32; 4] = [
    world_columns, world_rows,
    num_vms, 0,
  ];
  let config_uniforms_u8: &[u8] = bytemuck::cast_slice(&config_uniforms_u32);
  let uniform_buffer = device.create_uniform_buffer(
    config_uniforms_u8, Some("ReadoutRegistersForAnimalMoveUniforms")
  );

  // Create the output buffer.
  let output_buffer = GpuSeqBuffer::<CellCoord>::new(
    device,
    num_vms as usize,
    GpuBufferOptions::empty()
      .with_label("ReadoutRegistersForAnimalMoveComputedTargets")
      .with_storage(true)
      .with_copy_src(true),
  );

  // Load the shader.
  let source = include_str!("./readout_registers_for_animal_move.wgsl");
  let shader = device.create_shader_module(source, "ReadoutRegistersForAnimalMoveShader");

  // Create the compute pipeline.
  let compute_pipeline = device.device().create_compute_pipeline(
    &wgpu::ComputePipelineDescriptor {
      label: Some("ReadoutRegistersForAnimalMovePipeline"),
      layout: None,
      module: &shader,
      entry_point: "fill_registers",
    }
  );

  // Create the bind group.
  let bind_group_layout = compute_pipeline.get_bind_group_layout(0);
  let bind_group = device.device().create_bind_group(
    &wgpu::BindGroupDescriptor {
      label: Some("ReadoutRegistersForAnimalMoveBindGroup"),
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
          resource: start_pc_buffer.wgpu_buffer().as_entire_binding(),
        },
        wgpu::BindGroupEntry {
          binding: 3,
          resource: register_file_buffer.wgpu_buffer().as_entire_binding(),
        },
        wgpu::BindGroupEntry {
          binding: 4,
          resource: output_buffer.wgpu_buffer().as_entire_binding(),
        },
      ],
    }
  );

  // Add the compute pass.
  {
    let mut cpass = encoder.begin_compute_pass(&wgpu::ComputePassDescriptor {
      label: Some("ReadoutRegistersForAnimalMoveComputePass"),
    });
    cpass.set_pipeline(&compute_pipeline);
    cpass.set_bind_group(0, &bind_group, &[]);

    let dispatch_x =
      (num_vms + (READOUT_REGISTERS_WORKGROUP - 1))
        / READOUT_REGISTERS_WORKGROUP;
    cpass.dispatch_workgroups(dispatch_x, 1, 1);
  }

  output_buffer
}
