#[derive(Clone, Copy, Debug)]
pub(crate) struct TerrainInfo {
  data: [i32; Self::NUM_WORDS],
}
impl TerrainInfo {
  const NUM_WORDS: usize = 16;
  pub(crate) fn new() -> TerrainInfo {
    TerrainInfo { data: [0; Self::NUM_WORDS] }
  }
}
impl Default for TerrainInfo {
  fn default() -> Self {
    TerrainInfo::new()
  }
}
impl From<[i32; Self::NUM_WORDS]> for TerrainInfo {
  fn from(data: [i32; Self::NUM_WORDS]) -> TerrainInfo {
    TerrainInfo { data }
  }
}
impl Into<[i32; Self::NUM_WORDS]> for TerrainInfo {
  fn into(self) -> [i32; Self::NUM_WORDS] {
    self.data
  }
}
