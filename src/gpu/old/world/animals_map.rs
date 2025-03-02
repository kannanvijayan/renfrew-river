use crate::world::{ AnimalId, WorldDims };
use super::{ GpuDevice, GpuBufferOptions, GpuMapBuffer };

/**
 * AnimalId map of the world.
 */
pub(crate) struct GpuAnimalsMap {
  buffer: GpuMapBuffer<AnimalId>,
}
impl GpuAnimalsMap {
  pub(crate) fn new(
    device: &GpuDevice,
    dims: WorldDims,
    label: &'static str
  ) -> Self {
    let buffer = GpuMapBuffer::new(
      device,
      dims,
      GpuBufferOptions::empty()
        .with_label(label)
        .with_storage(true)
        .with_copy_src(true)
    );
    GpuAnimalsMap { buffer }
  }

  pub(crate) fn buffer(&self) -> &GpuMapBuffer<AnimalId> {
    &self.buffer
  }

  pub(crate) fn dims(&self) -> WorldDims {
    self.buffer.dims()
  }
}
