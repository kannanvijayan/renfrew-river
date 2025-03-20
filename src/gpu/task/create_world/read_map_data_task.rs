use crate::{
  cog::{ CogEncoder, CogSeqBuffer, CogTask },
  gpu::wgsl::common::{
    ReadMapDataEntrypoint,
    ReadMapDataShaderScript,
    ReadMapDataUniforms,
  },
  data::{
    map::{ CellCoord, WorldDims },
    ruleset::FormatComponentSelectorReadSpec,
  },
};

pub(crate) struct ReadMapDataTask {
  uniforms: ReadMapDataUniforms,
  input_buffer: CogSeqBuffer<u32>,
  output_buffer: CogSeqBuffer<u32>,
}
impl ReadMapDataTask {
  pub(crate) fn new(
    world_dims: WorldDims,
    top_left: CellCoord,
    area: WorldDims,
    selectors_vec: Vec<FormatComponentSelectorReadSpec>,
    input_buffer: CogSeqBuffer<u32>,
    input_entry_size: u32,
    output_buffer: CogSeqBuffer<u32>,
  ) -> Self {
    const MAX_SELECTORS: usize = 4;
    assert!(input_entry_size > 0, "Input entry size must be > 0");
    assert!(
      selectors_vec.len() <= MAX_SELECTORS,
      "Too many selectors: {}",
      selectors_vec.len(),
    );
    assert!(selectors_vec.len() > 0, "No selectors");
    let mut selectors: [Option<FormatComponentSelectorReadSpec>; MAX_SELECTORS] =
      [None; MAX_SELECTORS];
    for (i, sel) in selectors_vec.iter().enumerate() {
      selectors[i] = Some(*sel);
    }
    let uniforms = ReadMapDataUniforms {
      world_dims,
      top_left,
      area,
      selectors,
      input_entry_size,
      output_entry_size: selectors_vec.len() as u32,
    };

    Self {
      uniforms,
      input_buffer,
      output_buffer,
    }
  }
}

impl CogTask for ReadMapDataTask {
  fn encode(&self, encoder: &mut CogEncoder) {
    let uniforms = self.uniforms.clone();
    let device = encoder.device();
    let shader = device.create_shader_module::<ReadMapDataShaderScript>();
    shader.add_compute_pass_2d::<ReadMapDataEntrypoint, _>(
      encoder,
      uniforms,
      [self.uniforms.area.columns_u32(), self.uniforms.area.rows_u32()],
      "CreateWorld_ReadMapTask",
      |cpass| {
        cpass.add_bind_group(|bg| {
          bg.add_seq_buffer(&self.input_buffer)
            .add_seq_buffer(&self.output_buffer)
        });
      }
    );
  }
}
