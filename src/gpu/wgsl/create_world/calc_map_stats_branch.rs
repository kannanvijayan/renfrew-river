use crate::{
  cog::{ CogShaderEntrypoint2D, CogShaderScript, CogUniformType },
  data::map::WorldDims,
};

pub(crate) struct CalcMapStatsBranchShaderScript;
impl CogShaderScript for CalcMapStatsBranchShaderScript {
  type Uniforms = CalcMapStatsBranchUniforms;

  const NAME: &'static str = "CreateWorld_CalcMapStatsBranch";
  const SOURCE: &'static str = include_str!("calc_map_stats_branch.wgsl");
  const BIND_GROUPS: &'static [u32] = &[3];
}

pub(crate) struct CalcMapStatsBranchEntrypoint;
impl CogShaderEntrypoint2D<CalcMapStatsBranchShaderScript> for CalcMapStatsBranchEntrypoint {
  const NAME: &'static str = "calc_map_stats_branch";
  const WORKGROUP_SIZE: [u32; 2] = [8, 8];
}


#[derive(Debug, Clone)]
pub(crate) struct CalcMapStatsBranchUniforms {
  pub(crate) world_dims: WorldDims,
  pub(crate) area_dims: WorldDims,
}
impl CogUniformType for CalcMapStatsBranchUniforms {
  type GpuType = [u32; 4];
}
impl Into<[u32; 4]> for CalcMapStatsBranchUniforms {
  fn into(self) -> [u32; 4] {
    [
      self.world_dims.columns_u32(), self.world_dims.rows_u32(),
      self.area_dims.columns_u32(), self.area_dims.rows_u32(),
    ]
  }
}
