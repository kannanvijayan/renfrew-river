use serde::{ Serialize, Deserialize };
use crate::gpu::{ GpuBufferDataType, ShadyProgramIndex };

#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
#[derive(Serialize, Deserialize)]
pub(crate) struct SpeciesId(pub(crate) u32);
impl SpeciesId {
  pub(crate) const INVALID: SpeciesId = SpeciesId(0xffff_ffff_u32);

  pub(crate) const fn from_u32(id: u32) -> SpeciesId {
    SpeciesId(id)
  }
  pub(crate) const fn to_u32(&self) -> u32 {
    self.0
  }
}
impl GpuBufferDataType for SpeciesId {
  type NativeType = u32;

  fn to_native(&self) -> Self::NativeType {
    self.0
  }
  fn from_native(data_type: Self::NativeType) -> Self {
    SpeciesId(data_type)
  }
}

/**
 * The persisted gpu data for a species.
 */
#[derive(Clone, Copy, Debug)]
#[derive(Serialize, Deserialize)]
pub(crate) struct SpeciesData {
  pub(crate) program_index: ShadyProgramIndex,
}

impl GpuBufferDataType for SpeciesData {
  type NativeType = u32;

  fn to_native(&self) -> Self::NativeType {
    self.program_index.to_u32()
  }
  fn from_native(data_type: Self::NativeType) -> Self {
    SpeciesData {
      program_index: ShadyProgramIndex::from_u32(data_type),
    }
  }
}

/**
 * The in-memory CPU data for a species.
 */
#[derive(Clone, Copy, Debug)]
#[derive(Serialize, Deserialize)]
pub(crate) struct SpeciesInfo {
  pub(crate) id: SpeciesId,
  pub(crate) data: SpeciesData,
}
