use std::cell::Cell;
use crate::{
  cog::{ CogEncoder, CogTask },
  gpu::{
    wgsl::{
      create_world::{
        RandGenEntrypoint,
        RandGenShaderScript,
        RandGenUniforms,
      },
      common::{
        CalcMapHistoBranchEntrypoint,
        CalcMapHistoBranchShaderScript,
        CalcMapHistoBranchUniforms,
        CalcMapHistoLeafEntrypoint,
        CalcMapHistoLeafShaderScript,
        CalcMapHistoLeafUniforms,
      }
    },
    RandGenBuffer,
    HistogramBuffer,
  },
  ruleset::FormatComponentSelector,
  world::{ CellCoord, WorldDims },
};

pub(crate) struct RandGenTask {
  world_dims: WorldDims,
  rand_seed: u32,
  output_buffer: RandGenBuffer,
  outhist_buffers: Cell<Vec<HistogramBuffer>>,
}
impl RandGenTask {
  pub(crate) fn new(
    world_dims: WorldDims,
    rand_seed: u32,
    output_buffer: RandGenBuffer,
  ) -> Self {
    Self { world_dims, rand_seed, output_buffer, outhist_buffers: Cell::default() }
  }
}
impl RandGenTask {
  pub(crate) const NUM_BUCKETS: u32 = 7;
  pub(crate) const ENTRY_SIZE: u32 = 1;

  pub(crate) fn take_outhist_buffers(&self) -> Vec<HistogramBuffer> {
    self.outhist_buffers.take()
  }
}
impl CogTask for RandGenTask {
  fn encode(&self, encoder: &mut CogEncoder) {
    let uniforms = RandGenUniforms {
      world_dims: self.world_dims,
      top_left: CellCoord::zero(),
      out_dims: self.world_dims,
      rand_seed: self.rand_seed,
    };
    let device = encoder.device();
    let shader = device.create_shader_module::<RandGenShaderScript>();
    shader.add_compute_pass_2d::<RandGenEntrypoint, _>(
      encoder,
      uniforms,
      [self.world_dims.columns_u32(), self.world_dims.rows_u32()],
      "CreateWorld_RandGenTask",
      |cpass| {
        cpass.add_bind_group(|bg| {
          bg.add_map_buffer(self.output_buffer.buffer())
        });
      }
    );

    // Make a leaf task to compute the histogram for a single cell
    // The leaf task should pick an area size such that the output
    // histogram buffer has an entry count <= 64k.
    let leaf_area_w = self.world_dims.columns_u16().div_ceil(256);
    let leaf_area_h = self.world_dims.rows_u16().div_ceil(256);
    let leaf_area_dims = WorldDims::new(leaf_area_w, leaf_area_h);
    
    let grid_x = self.world_dims.columns_u32().div_ceil(leaf_area_w as u32);
    let grid_y = self.world_dims.rows_u32().div_ceil(leaf_area_h as u32);
    let leaf_grid_dims = WorldDims::new(grid_x as u16, grid_y as u16);
    eprintln!("KVKV RandGenTask: leaf_grid_dims = {leaf_grid_dims:?}");

    let leaf_out_buffer =
      HistogramBuffer::new(encoder.device(), leaf_grid_dims, Self::NUM_BUCKETS);

    let uniforms = CalcMapHistoLeafUniforms {
      world_dims: self.world_dims,
      area_dims: leaf_area_dims,
      value_range: [0, 0x10000],
      num_buckets: Self::NUM_BUCKETS,
      entry_size: Self::ENTRY_SIZE,
      selector: FormatComponentSelector::new(0, 0, 30),
    };
    let device = encoder.device();
    let shader = device.create_shader_module::<CalcMapHistoLeafShaderScript>();
    shader.add_compute_pass_2d::<CalcMapHistoLeafEntrypoint, _>(
      encoder,
      uniforms,
      [grid_x, grid_y],
      "CreateWorld_CalcMapHistoLeafTask",
      |cpass| {
        cpass.add_bind_group(|bg| {
          bg.add_seq_buffer(&self.output_buffer.buffer().as_seq_buffer())
            .add_seq_buffer(leaf_out_buffer.buffer())
        });
      }
    );

    const STEP_SCALEDOWN_LOG2: u32 = 2;
    const STEP_SCALEDOWN: u16 = 1_u16 << STEP_SCALEDOWN_LOG2;

    // Each histogram branch will merge a 4x4 block from the previous
    // branch.  Stop when the area of the dimensions is <= 1024,
    // or if either of the dimensions is < 4.
    let mut cur_dims = leaf_grid_dims;
    let mut cur_histo_buffer = leaf_out_buffer;
    let mut histo_buffers = vec![cur_histo_buffer.clone()];
    while cur_dims.area() > 1024 && cur_dims.columns > 4 && cur_dims.rows > 4 {
      let out_dims = cur_dims.scaledown_roundup(STEP_SCALEDOWN as u32);
      eprintln!("KVKV RandGenTask: HistoBranch cur_dims = {cur_dims:?}, out_dims = {out_dims:?}");
      let out_buffer =
        HistogramBuffer::new(encoder.device(), out_dims, Self::NUM_BUCKETS);

      let uniforms = CalcMapHistoBranchUniforms {
        world_dims: cur_dims,
        area_dims: WorldDims::new(STEP_SCALEDOWN, STEP_SCALEDOWN),
        num_buckets: Self::NUM_BUCKETS,
      };
      let device = encoder.device();
      let shader = device.create_shader_module::<CalcMapHistoBranchShaderScript>();
      shader.add_compute_pass_2d::<CalcMapHistoBranchEntrypoint, _>(
        encoder,
        uniforms,
        [out_dims.columns_u32(), out_dims.rows_u32()],
        "CreateWorld_CalcMapHistoBranchTask",
        |cpass| {
          cpass.add_bind_group(|bg| {
            bg.add_seq_buffer(cur_histo_buffer.buffer())
              .add_seq_buffer(out_buffer.buffer())
          });
        }
      );

      cur_dims = out_dims;
      histo_buffers.push(out_buffer.clone());
      cur_histo_buffer = out_buffer;
    }

    // Save the histogram buffers.
    self.outhist_buffers.set(histo_buffers);
  }
}
