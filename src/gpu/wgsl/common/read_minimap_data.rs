use crate::{
  cog::{ CogShaderEntrypoint2D, CogShaderScript, CogUniformType },
  ruleset::FormatComponentSelector,
  world::WorldDims,
};

pub(crate) struct ReadMinimapDataShaderScript;
impl CogShaderScript for ReadMinimapDataShaderScript {
  type Uniforms = ReadMinimapDataUniforms;

  const NAME: &'static str = "CreateWorld_ReadMinimapData";
  const SOURCE: &'static str = include_str!("read_minimap_data.wgsl");
  const BIND_GROUPS: &'static [u32] = &[3];
}

pub(crate) struct ReadMinimapDataEntrypoint;
impl CogShaderEntrypoint2D<ReadMinimapDataShaderScript> for ReadMinimapDataEntrypoint {
  const NAME: &'static str = "read_minimap_data";
  const WORKGROUP_SIZE: [u32; 2] = [8, 8];
}


#[derive(Debug, Clone)]
pub(crate) struct ReadMinimapDataUniforms {
  pub(crate) world_dims: WorldDims,
  pub(crate) mini_dims: WorldDims,
  pub(crate) entry_size: u32,
  pub(crate) selector: FormatComponentSelector,
}
impl CogUniformType for ReadMinimapDataUniforms {
  type GpuType = [u32; 6];
}
impl Into<[u32; 6]> for ReadMinimapDataUniforms {
  fn into(self) -> [u32; 6] {
    [
      self.world_dims.columns_u32(), self.world_dims.rows_u32(),
      self.mini_dims.columns_u32(), self.mini_dims.rows_u32(),
      self.entry_size,
      self.selector.to_u32(),
    ]
  }
}
