use crate::{
  cog::{ CogEncoder, CogTask },
  gpu::{
    wgsl::create_world::{
      RandGenEntrypoint,
      RandGenShaderScript,
      RandGenUniforms,
    },
    RandGenBuffer,
  },
  data::map::{ CellCoord, WorldDims },
};

pub(crate) struct RandGenTask {
  world_dims: WorldDims,
  rand_seed: u32,
  output_buffer: RandGenBuffer,
}
impl RandGenTask {
  pub(crate) fn new(
    world_dims: WorldDims,
    rand_seed: u32,
    output_buffer: RandGenBuffer,
  ) -> Self {
    Self { world_dims, rand_seed, output_buffer }
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
  }
}
