use crate::{
  cog::{ CogDevice, CogEncoder, CogSeqBuffer, CogTask },
  gpu::{
    wgsl::create_world::{
      CalcMapStatsBranchEntrypoint,
      CalcMapStatsBranchShaderScript,
      CalcMapStatsBranchUniforms,
      CalcMapStatsLeafEntrypoint,
      CalcMapStatsLeafShaderScript,
      CalcMapStatsLeafUniforms,
    },
    StatisticsMapBuffer,
  },
  data::{
    map::WorldDims,
    ruleset::FormatComponentSelector,
    Statistics,
  },
};

pub(crate) struct ComputeStatisticsTask {
  dims: WorldDims,
  entry_size: u32,
  selector: FormatComponentSelector,
  input_buffer: CogSeqBuffer<u32>,
  output_buffer: StatisticsMapBuffer,
}
impl ComputeStatisticsTask {
  const FIRST_STEP_DIMS: WorldDims = WorldDims::new(256, 256);
  const SCALEDOWN: u32 = 4;
  const SCALEDOWN_DIMS: WorldDims = WorldDims::new(
    Self::SCALEDOWN as u16,
    Self::SCALEDOWN as u16,
  );

  pub(crate) fn new(device: &CogDevice,
    dims: WorldDims,
    entry_size: u32,
    selector: FormatComponentSelector,
    input_buffer: CogSeqBuffer<u32>
  ) -> Self {
    let mut output_dims = Self::first_step_dims(dims);
    Self::for_each_branch_step_dims(dims, |step_dims| {
      output_dims = step_dims;
    });

    let output_buffer = StatisticsMapBuffer::new(device, output_dims);
    Self { dims, entry_size, selector, input_buffer, output_buffer }
  }

  pub(crate) fn output_buffer(&self) -> &StatisticsMapBuffer {
    &self.output_buffer
  }

  pub(crate) fn compute_statistics(&self) -> Statistics {
    self.output_buffer.compute_statistics()
  }

  // Iterate over the branch steps of the histogram computation, given the
  // dimensions of the first histogram buffer.
  fn for_each_branch_step_dims<F>(dims: WorldDims, func: F)
    where F: FnMut(WorldDims)
  {
    let mut func = func;

    // Each histogram branch will merge a 4x4 block from the previous
    // branch.  Stop when the area of the dimensions is <= 1024,
    // or if either of the dimensions is < 4.
    let mut cur_dims = Self::first_step_dims(dims);
    while cur_dims.area() > 1024 && cur_dims.columns > 4 && cur_dims.rows > 4 {
      let next_dims = cur_dims.div_ceil_u32(Self::SCALEDOWN);
      func(next_dims);
      cur_dims = next_dims;
    }
  }

  // Compute the dimensions of the first step of the statistics.
  // This may also the the dimensions of the last step, if the
  // map dimensions are small enough.
  fn first_step_dims(dims: WorldDims) -> WorldDims {
    let leaf_area = dims.div_ceil_dims(Self::FIRST_STEP_DIMS);
    if leaf_area.columns <= 1 || leaf_area.rows <= 1 {
      dims
    } else {
      dims.div_ceil_dims(leaf_area)
    }
  }
}
impl CogTask for ComputeStatisticsTask {
  fn encode(&self, encoder: &mut CogEncoder) {
    let leaf_grid_dims = Self::first_step_dims(self.dims);
    let leaf_area_dims = self.dims.div_ceil_dims(leaf_grid_dims);

    let leaf_out_buffer =
      StatisticsMapBuffer::new(encoder.device(), leaf_grid_dims);

    let uniforms = CalcMapStatsLeafUniforms {
      world_dims: self.dims,
      area_dims: leaf_area_dims,
      entry_size: self.entry_size,
      selector: self.selector,
    };
    let device = encoder.device();
    let shader = device.create_shader_module::<CalcMapStatsLeafShaderScript>();
    shader.add_compute_pass_2d::<CalcMapStatsLeafEntrypoint, _>(
      encoder,
      uniforms,
      [leaf_grid_dims.columns_u32(), leaf_grid_dims.rows_u32()],
      "CreateWorld_CalcMapStatsLeafTask",
      |cpass| {
        cpass.add_bind_group(|bg| {
          bg.add_seq_buffer(&self.input_buffer)
            .add_map_buffer(leaf_out_buffer.buffer())
        });
      }
    );

    let mut step_in_buffer = leaf_out_buffer;
    Self::for_each_branch_step_dims(self.dims, |step_out_dims| {
      // If this is the last step, pick the output buffer, otherwise,
      // create a new intermediate buffer.
      let step_out_buffer = if  step_out_dims == *self.output_buffer.dims() {
        self.output_buffer.clone()
      } else {
        StatisticsMapBuffer::new(encoder.device(), step_out_dims)
      };

      let uniforms = CalcMapStatsBranchUniforms {
        world_dims: *step_in_buffer.dims(),
        area_dims: Self::SCALEDOWN_DIMS,
      };
      let device = encoder.device();
      let shader = device.create_shader_module::<CalcMapStatsBranchShaderScript>();
      shader.add_compute_pass_2d::<CalcMapStatsBranchEntrypoint, _>(
        encoder,
        uniforms,
        [step_out_dims.columns_u32(), step_out_dims.rows_u32()],
        "CreateWorld_CalcMapStatsBranchTask",
        |cpass| {
          cpass.add_bind_group(|bg| {
            bg.add_map_buffer(step_in_buffer.buffer())
              .add_map_buffer(step_out_buffer.buffer())
          });
        }
      );

      step_in_buffer = step_out_buffer;
    });
  }
}
