use crate::gpu::GpuBufferDataType;

pub(crate) type ElevationValueType = u16;

#[derive(Clone, Copy, Debug)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct Elevation(pub(crate) ElevationValueType);
impl Elevation {
  pub(crate) fn default() -> Elevation {
    Elevation(127)
  }

  pub(crate) fn from_value(value: ElevationValueType) -> Elevation {
    Elevation(value as ElevationValueType)
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
