
use serde;
use crate::{
  world::CellCoord,
  gpu::GpuBufferDataType
};

#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct AnimalId(pub(crate) u32);
impl AnimalId {
  pub(crate) const INVALID: AnimalId = AnimalId(0xffff_ffff);

  pub(crate) const fn from_u32(id: u32) -> AnimalId {
    AnimalId(id)
  }
  pub(crate) const fn to_u32(&self) -> u32 {
    self.0
  }
}
impl GpuBufferDataType for AnimalId {
  type NativeType = u32;

  fn to_native(&self) -> Self::NativeType {
    self.0
  }
  fn from_native(data_type: Self::NativeType) -> Self {
    AnimalId(data_type)
  }
}

/**
 * The persisted gpu data for an entity.
 */
#[derive(Clone, Copy, Debug)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct AnimalData {
  // Position of entity.
  pub(crate) position: CellCoord,
}

impl GpuBufferDataType for AnimalData {
  type NativeType = u32;

  fn to_native(&self) -> Self::NativeType {
    self.position.encode_u32()
  }
  fn from_native(data_type: Self::NativeType) -> Self {
    AnimalData {
      position: CellCoord::decode_u32(data_type)
    }
  }
}
