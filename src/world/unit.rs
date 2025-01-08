use serde;
use crate::{
  world::CellCoord,
  gpu::{ GpuBufferDataType, ShadyProgramIndex },
};

#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct UnitId(pub(crate) u32);
impl UnitId {
  pub(crate) const INVALID: UnitId = UnitId(0xffff_ffff);

  pub(crate) const fn from_u32(id: u32) -> UnitId {
    UnitId(id)
  }
  pub(crate) const fn to_u32(&self) -> u32 {
    self.0
  }
}
impl GpuBufferDataType for UnitId {
  type NativeType = u32;

  fn to_native(&self) -> Self::NativeType {
    self.0
  }
  fn from_native(data_type: Self::NativeType) -> Self {
    UnitId(data_type)
  }
}

/**
 * The persisted gpu data for a unit.
 */
#[derive(Clone, Copy, Debug)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct UnitData {
  // Position of unit.
  pub(crate) position: CellCoord,

  // The program for the unit.
  pub(crate) program: ShadyProgramIndex,
}
impl UnitData {
  pub(crate) fn is_invalid(&self) -> bool {
    self.position.is_invalid()
  }
}
impl GpuBufferDataType for UnitData {
  type NativeType = [u32; 2];

  fn to_native(&self) -> Self::NativeType {
    [self.position.to_native(), self.program.to_native()]
  }
  fn from_native(data_type: Self::NativeType) -> Self {
    UnitData {
      position: CellCoord::from_native(data_type[0]),
      program: ShadyProgramIndex::from_native(data_type[1]),
    }
  }
}
