use crate::{
  cog::{ CogShaderEntrypoint2D, CogShaderScript, CogUniformType },
  ruleset::FormatComponentSelector,
  world::WorldDims,
};

pub(crate) struct CalcMapHistoLeafShaderScript;
impl CogShaderScript for CalcMapHistoLeafShaderScript {
  type Uniforms = CalcMapHistoLeafUniforms;

  const NAME: &'static str = "CreateWorld_CalcMapHistoLeaf";
  const SOURCE: &'static str = include_str!("calc_map_histo_leaf.wgsl");
  const BIND_GROUPS: &'static [u32] = &[3];
}

pub(crate) struct CalcMapHistoLeafEntrypoint;
impl CogShaderEntrypoint2D<CalcMapHistoLeafShaderScript> for CalcMapHistoLeafEntrypoint {
  const NAME: &'static str = "calc_map_histo_leaf";
  const WORKGROUP_SIZE: [u32; 2] = [8, 8];
}


#[derive(Debug, Clone)]
pub(crate) struct CalcMapHistoLeafUniforms {
  pub(crate) world_dims: WorldDims,
  pub(crate) area_dims: WorldDims,
  pub(crate) value_range: [u32; 2],
  pub(crate) num_buckets: u32,
  pub(crate) entry_size: u32,
  pub(crate) selector: FormatComponentSelector,
}
impl CogUniformType for CalcMapHistoLeafUniforms {
  type GpuType = [u32; 10];
}
impl Into<[u32; 10]> for CalcMapHistoLeafUniforms {
  fn into(self) -> [u32; 10] {
    [
      self.world_dims.columns_u32(), self.world_dims.rows_u32(),
      self.area_dims.columns_u32(), self.area_dims.rows_u32(),
      self.value_range[0], self.value_range[1],
      self.num_buckets,
      self.entry_size,
      self.selector.to_u32(),
      0
    ]
  }
}
