use crate::{
  cog::{ CogShaderEntrypoint2D, CogShaderScript, CogUniformType },
  data::{
    map::WorldDims,
    ruleset::FormatComponentSelector,
  },
};

pub(crate) struct RescaleMapDataShaderScript;
impl CogShaderScript for RescaleMapDataShaderScript {
  type Uniforms = RescaleMapDataUniforms;

  const NAME: &'static str = "CreateWorld_RescaleMapDataTask";
  const SOURCE: &'static str = include_str!("rescale_map_data.wgsl");
  const BIND_GROUPS: &'static [u32] = &[3];
}

pub(crate) struct RescaleMapDataEntrypoint;
impl CogShaderEntrypoint2D<RescaleMapDataShaderScript> for RescaleMapDataEntrypoint {
  const NAME: &'static str = "rescale_map_data";
  const WORKGROUP_SIZE: [u32; 2] = [8, 8];
}

pub(crate) struct RescaleMapDataUniforms {
  pub(crate) world_dims: WorldDims,
  pub(crate) src_value_range: [u32; 2],
  pub(crate) dst_value_range: [u32; 2],
  pub(crate) entry_size: u32,
  pub(crate) selector: FormatComponentSelector,
}
impl CogUniformType for RescaleMapDataUniforms {
  type GpuType = [u32; 8];
}
impl Into<[u32; 8]> for RescaleMapDataUniforms {
  fn into(self) -> [u32; 8] {
    [
      self.world_dims.columns_u32(), self.world_dims.rows_u32(),
      self.src_value_range[0], self.src_value_range[1],
      self.dst_value_range[0], self.dst_value_range[1],
      self.entry_size, self.selector.to_u32(),
    ]
  }
}
