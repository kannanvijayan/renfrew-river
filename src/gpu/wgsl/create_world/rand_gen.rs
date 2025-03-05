use crate::{
  cog::{ CogMapBuffer, CogShaderEntrypoint2D, CogShaderScript, CogUniformType },
  world::{ CellCoord, WorldDims }
};

pub(crate) struct RandGenShaderScript;
impl CogShaderScript for RandGenShaderScript {
  type Uniforms = RandGenUniforms;

  const NAME: &'static str = "CreateWorld_RandGenTask";
  const SOURCE: &'static str = include_str!("rand_gen.wgsl");
  const BIND_GROUPS: &'static [u32] = &[2];
}

pub(crate) struct RandGenEntrypoint;
impl CogShaderEntrypoint2D<RandGenShaderScript> for RandGenEntrypoint {
  const NAME: &'static str = "rand_gen_task";
  const WORKGROUP_SIZE: [u32; 2] = [8, 8];
}

pub(crate) struct RandGenUniforms {
  pub(crate) world_dims: WorldDims,
  pub(crate) top_left: CellCoord,
  pub(crate) out_dims: WorldDims,
  pub(crate) rand_seed: u32,
}
impl CogUniformType for RandGenUniforms {
  type GpuType = [u32; 8];
}
impl Into<[u32; 8]> for RandGenUniforms {
  fn into(self) -> [u32; 8] {
    [
      self.world_dims.columns_u32(), self.world_dims.rows_u32(),
      self.top_left.col_u32(), self.top_left.row_u32(),
      self.out_dims.columns_u32(), self.out_dims.rows_u32(),
      self.rand_seed, 0
    ]
  }
}

pub(crate) struct RandGenBuffers {
  pub(crate) output: CogMapBuffer<u32>,
}
