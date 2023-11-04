use crate::gpu::GpuBufferDataType;

pub(crate) type ElevationValueType = u16;

#[derive(Clone, Copy, Debug)]
pub(crate) struct Elevation(ElevationValueType);
impl Elevation {
  pub(crate) fn new(elevation: ElevationValueType)
    -> Elevation
  {
    assert!(elevation <= 255, "Elevation must be <= 255");
    Elevation(elevation)
  }
  pub(crate) fn default() -> Elevation {
    Elevation(127)
  }

  pub(crate) fn value(&self) -> ElevationValueType {
    self.0
  }
}
impl Default for Elevation {
  fn default() -> Self {
    Elevation::default()
  }
}
impl GpuBufferDataType for Elevation {
  type NativeType = ElevationValueType;
  fn to_native(&self) -> Self::NativeType {
    self.0
  }
  fn from_native(native: Self::NativeType) -> Self {
    Elevation(native)
  }
}