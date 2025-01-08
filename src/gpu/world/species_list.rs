use crate::{
  persist::SpeciesListPersist,
  world::{ SpeciesData, SpeciesInfo },
};
use super::{ GpuDevice, GpuBufferOptions, GpuSeqBuffer };

/**
 * Elevation map of the world.
 */
pub(crate) struct GpuSpeciesList {
  vec: Vec<SpeciesInfo>,
  buffer: GpuSeqBuffer<SpeciesData>,
}
impl GpuSpeciesList {
  pub(crate) fn new(device: &GpuDevice, length: usize, label: &'static str)
    -> Self
  {
    let vec = Vec::with_capacity(length);
    let buffer = GpuSeqBuffer::new(
      device,
      length,
      GpuBufferOptions::empty()
        .with_label(label)
        .with_storage(true)
        .with_copy_src(true)
        .with_copy_dst(true)
    );
    GpuSpeciesList { vec, buffer }
  }

  pub(crate) fn buffer(&self) -> &GpuSeqBuffer<SpeciesData> {
    &self.buffer
  }

  pub(crate) fn to_persist(&self) -> SpeciesListPersist {
    SpeciesListPersist::new(self.vec.clone())
  }

  pub(crate) fn from_persist(device: &GpuDevice, persist: &SpeciesListPersist)
    -> Self
  {
    let species_list = GpuSpeciesList::new(
      device,
      persist.as_slice().len(),
      "GpuSpeciesListFromPersist"
    );
    species_list.buffer().write_iter_staged(
      device,
      0,
      persist.as_slice().iter().map(|info| &info.data)
    );
    species_list
  }
}
