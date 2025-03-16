use crate::{
  cog::{ CogEncoder, CogSeqBuffer, CogTask },
  gpu::wgsl::common::{
    ReadMinimapDataEntrypoint,
    ReadMinimapDataShaderScript,
    ReadMinimapDataUniforms,
  },
  ruleset::FormatComponentSelector,
  world::WorldDims,
};

pub(crate) struct ReadMinimapDataTask {
  uniforms: ReadMinimapDataUniforms,
  input_buffer: CogSeqBuffer<u32>,
  output_buffer: CogSeqBuffer<u32>,
}
impl ReadMinimapDataTask {
  pub(crate) fn new(
    world_dims: WorldDims,
    mini_dims: WorldDims,
    entry_size: u32,
    selector: FormatComponentSelector,
    input_buffer: CogSeqBuffer<u32>,
    output_buffer: CogSeqBuffer<u32>,
  ) -> Self {
    assert!(entry_size > 0, "Input entry size must be > 0");
    let uniforms =
      ReadMinimapDataUniforms { world_dims, mini_dims, entry_size, selector };
    Self { uniforms, input_buffer, output_buffer }
  }
}

impl CogTask for ReadMinimapDataTask {
  fn encode(&self, encoder: &mut CogEncoder) {
    let uniforms = self.uniforms.clone();
    let device = encoder.device();
    let shader = device.create_shader_module::<ReadMinimapDataShaderScript>();
    shader.add_compute_pass_2d::<ReadMinimapDataEntrypoint, _>(
      encoder,
      uniforms,
      [self.uniforms.mini_dims.columns_u32(), self.uniforms.mini_dims.rows_u32()],
      "CreateWorld_ReadMinimapTask",
      |cpass| {
        cpass.add_bind_group(|bg| {
          bg.add_seq_buffer(&self.input_buffer)
            .add_seq_buffer(&self.output_buffer)
        });
      }
    );
  }
}
