use serde;
use crate::{
  world::CellCoord,
  gpu::GpuBufferDataType
};

#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub(crate) struct EntityId(u32);
impl EntityId {
  const INVALID_ID: EntityId = EntityId(0);

  pub(crate) const fn new(id: u32) -> EntityId {
    EntityId(id)
  }
  pub(crate) const fn value(&self) -> u32 {
    self.0
  }
}

/**
 * The persisted gpu data for an entity.
 */
#[derive(Clone, Debug)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct EntityData {
  // Position of entity.
  pub(crate) position: CellCoord,
}

impl GpuBufferDataType for EntityData {
  type NativeType = u32;

  fn to_native(&self) -> Self::NativeType {
    self.position.encode_u32()
  }
  fn from_native(data_type: Self::NativeType) -> Self {
    EntityData {
      position: CellCoord::decode_u32(data_type)
    }
  }
}