use crate::gpu::GpuBufferDataType;


#[derive(Clone, Copy, Debug)]
#[repr(u8)]
pub(crate) enum TerrainKind {
  Empty = 0_u8,
  Land = 1_u8,
  Ocean = 2_u8,
}
impl TerrainKind {
  pub(crate) fn default() -> TerrainKind {
    TerrainKind::Empty
  }
}
impl Default for TerrainKind {
  fn default() -> Self {
    TerrainKind::default()
  }
}