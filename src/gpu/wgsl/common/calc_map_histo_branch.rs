use crate::{
  cog::{ CogShaderEntrypoint2D, CogShaderScript, CogUniformType },
  world::WorldDims,
};

pub(crate) struct CalcMapHistoBranchShaderScript;
impl CogShaderScript for CalcMapHistoBranchShaderScript {
  type Uniforms = CalcMapHistoBranchUniforms;

  const NAME: &'static str = "CreateWorld_CalcMapHistoBranch";
  const SOURCE: &'static str = include_str!("calc_map_histo_branch.wgsl");
  const BIND_GROUPS: &'static [u32] = &[3];
}

pub(crate) struct CalcMapHistoBranchEntrypoint;
impl CogShaderEntrypoint2D<CalcMapHistoBranchShaderScript> for CalcMapHistoBranchEntrypoint {
  const NAME: &'static str = "calc_map_histo_branch";
  const WORKGROUP_SIZE: [u32; 2] = [8, 8];
}


#[derive(Debug, Clone)]
pub(crate) struct CalcMapHistoBranchUniforms {
  pub(crate) world_dims: WorldDims,
  pub(crate) area_dims: WorldDims,
  pub(crate) num_buckets: u32,
}
impl CogUniformType for CalcMapHistoBranchUniforms {
  type GpuType = [u32; 8];
}
impl Into<[u32; 8]> for CalcMapHistoBranchUniforms {
  fn into(self) -> [u32; 8] {
    [
      self.world_dims.columns_u32(), self.world_dims.rows_u32(),
      self.area_dims.columns_u32(), self.area_dims.rows_u32(),
      self.num_buckets, 0, 0, 0,
    ]
  }
}
