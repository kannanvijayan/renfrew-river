use crate::gpu::GpuBufferDataType;


#[derive(Clone, Copy, Debug)]
#[repr(u8)]
pub(crate) enum TerrainKind {
  Empty,
  Soil,
  Water,
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

pub(crate) type TerrainElevationValueType = u16;
pub(crate) const TERRAIN_ELEVATION_BITS: u32 = 10;

#[derive(Clone, Copy, Debug)]
pub(crate) struct TerrainElevation(TerrainElevationValueType);
impl TerrainElevation {
  pub(crate) fn new(elevation: TerrainElevationValueType)
    -> TerrainElevation
  {
    assert!(elevation <= 255, "Elevation must be <= 255");
    TerrainElevation(elevation)
  }
  pub(crate) fn default() -> TerrainElevation {
    TerrainElevation(127)
  }

  pub(crate) fn value(&self) -> TerrainElevationValueType {
    self.0
  }
}
impl Default for TerrainElevation {
  fn default() -> Self {
    TerrainElevation::default()
  }
}
impl GpuBufferDataType for TerrainElevation {
  type NativeType = TerrainElevationValueType;
  fn to_native(&self) -> Self::NativeType {
    self.0
  }
  fn from_native(native: Self::NativeType) -> Self {
    TerrainElevation(native)
  }
}