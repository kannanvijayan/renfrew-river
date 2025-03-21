use crate::{
  cog::{ CogEncoder, CogSeqBuffer, CogTask },
  gpu::wgsl::create_world::{
    BorderFadeEntrypoint,
    BorderFadeShaderScript,
    BorderFadeUniforms,
  },
  data::{
    map::WorldDims,
    ruleset::FormatComponentSelector,
  },
};

pub(crate) struct BorderFadeTask {
  world_dims: WorldDims,
  dist_pct: [u32; 2],
  entry_size: u32,
  selector: FormatComponentSelector,
  min_value: u32,
  input_buffer: CogSeqBuffer<u32>,
  output_buffer: CogSeqBuffer<u32>,
}
impl BorderFadeTask {
  pub(crate) fn new(
    world_dims: WorldDims,
    dist_pct: [u32; 2],
    entry_size: u32,
    selector: FormatComponentSelector,
    min_value: u32,
    input_buffer: CogSeqBuffer<u32>,
    output_buffer: CogSeqBuffer<u32>,
  ) -> Self {
    assert!(world_dims.area() > 0, "World dims must be > 0");
    assert!(entry_size > 0, "Input entry size must be > 0");
    Self {
      world_dims,
      dist_pct,
      entry_size,
      selector,
      min_value,
      input_buffer,
      output_buffer,
    }
  }
}
impl CogTask for BorderFadeTask {
  fn encode(&self, encoder: &mut CogEncoder) {
    let uniforms = BorderFadeUniforms {
      world_dims: self.world_dims,
      dist_pct: self.dist_pct,
      entry_size: self.entry_size,
      min_value: self.min_value,
      selector: self.selector,
    };
    let device = encoder.device();
    let shader = device.create_shader_module::<BorderFadeShaderScript>();
    shader.add_compute_pass_2d::<BorderFadeEntrypoint, _>(
      encoder,
      uniforms,
      [self.world_dims.columns_u32(), self.world_dims.rows_u32()],
      "CreateWorld_BorderFadeTask",
      |cpass| {
        cpass.add_bind_group(|bg| {
          bg.add_seq_buffer(&self.input_buffer)
            .add_seq_buffer(&self.output_buffer)
        });
      }
    );
  }
}
