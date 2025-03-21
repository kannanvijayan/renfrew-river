use crate::{
  cog::{ CogEncoder, CogSeqBuffer, CogTask },
  gpu::wgsl::create_world::{
    RescaleMapDataEntrypoint,
    RescaleMapDataShaderScript,
    RescaleMapDataUniforms,
  },
  data::{
    map::WorldDims,
    ruleset::FormatComponentSelector,
  },
};

pub(crate) struct RescaleMapDataTask {
  world_dims: WorldDims,
  src_value_range: [u32; 2],
  dst_value_range: [u32; 2],
  entry_size: u32,
  selector: FormatComponentSelector,
  input_buffer: CogSeqBuffer<u32>,
  output_buffer: CogSeqBuffer<u32>,
}
impl RescaleMapDataTask {
  pub(crate) fn new(
    world_dims: WorldDims,
    src_value_range: [u32; 2],
    dst_value_range: [u32; 2],
    entry_size: u32,
    selector: FormatComponentSelector,
    input_buffer: CogSeqBuffer<u32>,
    output_buffer: CogSeqBuffer<u32>,
  ) -> Self {
    assert!(world_dims.area() > 0, "World dims must be > 0");
    assert!(entry_size > 0, "Input entry size must be > 0");
    Self {
      world_dims,
      src_value_range,
      dst_value_range,
      entry_size,
      selector,
      input_buffer,
      output_buffer,
    }
  }
}
impl CogTask for RescaleMapDataTask {
  fn encode(&self, encoder: &mut CogEncoder) {
    let uniforms = RescaleMapDataUniforms {
      world_dims: self.world_dims,
      src_value_range: self.src_value_range,
      dst_value_range: self.dst_value_range,
      entry_size: self.entry_size,
      selector: self.selector,
    };
    let device = encoder.device();
    let shader = device.create_shader_module::<RescaleMapDataShaderScript>();
    shader.add_compute_pass_2d::<RescaleMapDataEntrypoint, _>(
      encoder,
      uniforms,
      [self.world_dims.columns_u32(), self.world_dims.rows_u32()],
      "CreateWorld_RescaleMapDataTask",
      |cpass| {
        cpass.add_bind_group(|bg| {
          bg.add_seq_buffer(&self.input_buffer)
            .add_seq_buffer(&self.output_buffer)
        });
      }
    );
  }
}
