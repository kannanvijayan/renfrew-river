use crate::{
  cog::{ CogEncoder, CogSeqBuffer, CogTask },
  gpu::{
    wgsl::common::{
      ReadMapDataEntrypoint,
      ReadMapDataShaderScript,
      ReadMapDataUniforms,
    },
    CellDataBuffer,
  },
  ruleset::FormatComponentSelector,
  world::{ CellCoord, CellData, WorldDims },
};

pub(crate) struct ReadMapDataTask {
  uniforms: ReadMapDataUniforms,
  input_buffer: CellDataBuffer,
  output_buffer: CogSeqBuffer<u32>,
}
impl ReadMapDataTask {
  pub(crate) fn new(
    world_dims: WorldDims,
    top_left: CellCoord,
    area: WorldDims,
    selectors_vec: Vec<FormatComponentSelector>,
    input_buffer: CellDataBuffer,
    output_buffer: CogSeqBuffer<u32>,
  ) -> Self {
    const MAX_SELECTORS: usize = 4;
    let num_selectors = selectors_vec.len();
    assert!(
      num_selectors <= MAX_SELECTORS,
      "Too many selectors: {}",
      num_selectors,
    );
    let mut selectors: [Option<FormatComponentSelector>; MAX_SELECTORS] =
      [None; MAX_SELECTORS];
    for (i, sel) in selectors_vec.iter().enumerate() {
      selectors[i] = Some(*sel);
    }
    let uniforms = ReadMapDataUniforms {
      world_dims,
      top_left,
      area,
      selectors,
      input_entry_size: CellData::NUM_WORDS,
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
      "CreateWorld_RandGenTask",
      |cpass| {
        cpass.add_bind_group(|bg| {
          bg.add_seq_buffer(&self.input_buffer.as_u32_seq_buffer())
            .add_seq_buffer(&self.output_buffer)
        });
      }
    );
  }
}
