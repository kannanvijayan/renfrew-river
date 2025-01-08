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
    );
    GpuSpeciesList { vec, buffer }
  }

  pub(crate) fn buffer(&self) -> &GpuSeqBuffer<SpeciesData> {
    &self.buffer
  }

  pub(crate) fn to_persist(&self) -> SpeciesListPersist {
    SpeciesListPersist::new(self.vec.clone())
  }
}
