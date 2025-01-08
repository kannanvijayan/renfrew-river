use serde::{ Serialize, Deserialize };
use crate::{
  gpu::GpuBufferDataType,
  world::{ AnimalData, AnimalId },
};

/**
 * Persistable representation of a list of animals.
 */
#[derive(Debug, Clone)]
#[derive(Serialize, Deserialize)]
pub(crate) struct AnimalsListPersist {
  animals: Vec<AnimalPersist>,
}
impl AnimalsListPersist {
  pub(crate) fn new(animals: Vec<AnimalPersist>) -> Self {
    AnimalsListPersist { animals }
  }

  pub(crate) fn as_slice(&self) -> &[AnimalPersist] {
    &self.animals
  }
}

/**
 * Persistable representation of an animal.
 */
#[derive(Debug, Clone)]
#[derive(Serialize, Deserialize)]
pub(crate) struct AnimalPersist {
  id: AnimalId,
  data: AnimalData,
}
impl AnimalPersist {
  pub(crate) fn new(id: AnimalId, data: AnimalData) -> Self {
    AnimalPersist { id, data }
  }
}
impl GpuBufferDataType for AnimalPersist {
  type NativeType = [u32; 2];

  fn to_native(&self) -> Self::NativeType {
    [self.id.to_native(), self.data.to_native()]
  }
  fn from_native(data_type: Self::NativeType) -> Self {
    AnimalPersist {
      id: AnimalId::from_u32(data_type[0]),
      data: AnimalData::from_native(data_type[1]),
    }
  }
}
