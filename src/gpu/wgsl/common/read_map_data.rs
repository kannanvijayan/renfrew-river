use crate::{
  cog::{ CogShaderEntrypoint2D, CogShaderScript, CogUniformType },
  data::{
    map::{ CellCoord, WorldDims },
    ruleset::FormatComponentSelectorReadSpec,
  },
};

pub(crate) struct ReadMapDataShaderScript;
impl CogShaderScript for ReadMapDataShaderScript {
  type Uniforms = ReadMapDataUniforms;

  const NAME: &'static str = "CreateWorld_ReadMapData";
  const SOURCE: &'static str = include_str!("read_map_data.wgsl");
  const BIND_GROUPS: &'static [u32] = &[3];
}

pub(crate) struct ReadMapDataEntrypoint;
impl CogShaderEntrypoint2D<ReadMapDataShaderScript> for ReadMapDataEntrypoint {
  const NAME: &'static str = "read_map_data";
  const WORKGROUP_SIZE: [u32; 2] = [8, 8];
}


#[derive(Debug, Clone)]
pub(crate) struct ReadMapDataUniforms {
  pub(crate) selectors: [Option<FormatComponentSelectorReadSpec>; 4],
  pub(crate) world_dims: WorldDims,
  pub(crate) top_left: CellCoord,
  pub(crate) area: WorldDims,
  pub(crate) input_entry_size: u32,
  pub(crate) output_entry_size: u32,
}
impl CogUniformType for ReadMapDataUniforms {
  type GpuType = [u32; 16];
}
impl Into<[u32; 16]> for ReadMapDataUniforms {
  fn into(self) -> [u32; 16] {
    let mut selectors: [u32; 4] = [u32::MAX, u32::MAX, u32::MAX, u32::MAX];
    for (i, selector) in self.selectors.iter().enumerate() {
      if let Some(s) = selector {
        selectors[i] = s.to_u32();
      } else {
        break;
      }
    }

    [
      selectors[0], selectors[1], selectors[2], selectors[3],
      self.world_dims.columns_u32(), self.world_dims.rows_u32(),
      self.top_left.col_u32(), self.top_left.row_u32(),
      self.area.columns_u32(), self.area.rows_u32(),
      self.input_entry_size, self.output_entry_size, 0, 0, 0, 0
    ]
  }
}
