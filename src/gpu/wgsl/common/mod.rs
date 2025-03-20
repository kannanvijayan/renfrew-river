mod read_map_data;
mod read_minimap_data;

pub(crate) use self::{
  read_map_data::{
    ReadMapDataEntrypoint,
    ReadMapDataShaderScript,
    ReadMapDataUniforms,
  },
  read_minimap_data::{
    ReadMinimapDataEntrypoint,
    ReadMinimapDataShaderScript,
    ReadMinimapDataUniforms,
  },
};
