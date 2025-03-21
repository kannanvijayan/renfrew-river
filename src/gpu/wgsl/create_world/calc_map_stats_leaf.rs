use crate::{
  cog::{ CogShaderEntrypoint2D, CogShaderScript, CogUniformType },
  data::{
    map::WorldDims,
    ruleset::FormatComponentSelector,
  },
};

pub(crate) struct CalcMapStatsLeafShaderScript;
impl CogShaderScript for CalcMapStatsLeafShaderScript {
  type Uniforms = CalcMapStatsLeafUniforms;

  const NAME: &'static str = "CreateWorld_CalcMapStatsLeaf";
  const SOURCE: &'static str = include_str!("calc_map_stats_leaf.wgsl");
  const BIND_GROUPS: &'static [u32] = &[3];
}

pub(crate) struct CalcMapStatsLeafEntrypoint;
impl CogShaderEntrypoint2D<CalcMapStatsLeafShaderScript> for CalcMapStatsLeafEntrypoint {
  const NAME: &'static str = "calc_map_stats_leaf";
  const WORKGROUP_SIZE: [u32; 2] = [8, 8];
}


#[derive(Debug, Clone)]
pub(crate) struct CalcMapStatsLeafUniforms {
  pub(crate) world_dims: WorldDims,
  pub(crate) area_dims: WorldDims,
  pub(crate) entry_size: u32,
  pub(crate) selector: FormatComponentSelector,
}
impl CogUniformType for CalcMapStatsLeafUniforms {
  type GpuType = [u32; 8];
}
impl Into<[u32; 8]> for CalcMapStatsLeafUniforms {
  fn into(self) -> [u32; 8] {
    [
      self.world_dims.columns_u32(), self.world_dims.rows_u32(),
      self.area_dims.columns_u32(), self.area_dims.rows_u32(),
      self.entry_size, self.selector.to_u32(),
      0, 0
    ]
  }
}
