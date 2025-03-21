use crate::{
  cog::{ CogShaderEntrypoint2D, CogShaderScript, CogUniformType },
  data::{
    map::WorldDims,
    ruleset::FormatComponentSelector,
  },
};

pub(crate) struct BorderFadeShaderScript;
impl CogShaderScript for BorderFadeShaderScript {
  type Uniforms = BorderFadeUniforms;

  const NAME: &'static str = "CreateWorld_BorderFadeTask";
  const SOURCE: &'static str = include_str!("border_fade.wgsl");
  const BIND_GROUPS: &'static [u32] = &[3];
}

pub(crate) struct BorderFadeEntrypoint;
impl CogShaderEntrypoint2D<BorderFadeShaderScript> for BorderFadeEntrypoint {
  const NAME: &'static str = "border_fade";
  const WORKGROUP_SIZE: [u32; 2] = [8, 8];
}

pub(crate) struct BorderFadeUniforms {
  pub(crate) world_dims: WorldDims,
  pub(crate) dist_pct: [u32; 2],
  pub(crate) entry_size: u32,
  pub(crate) selector: FormatComponentSelector,
  pub(crate) min_value: u32,
}
impl CogUniformType for BorderFadeUniforms {
  type GpuType = [u32; 8];
}
impl Into<[u32; 8]> for BorderFadeUniforms {
  fn into(self) -> [u32; 8] {
    [
      self.world_dims.columns_u32(), self.world_dims.rows_u32(),
      self.dist_pct[0], self.dist_pct[1],
      self.entry_size, self.selector.to_u32(),
      self.min_value, 0
    ]
  }
}
