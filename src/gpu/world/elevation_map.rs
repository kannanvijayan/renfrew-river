use crate::{
  persist::ElevationMapPersist,
  world::{ Elevation, WorldDims },
};
use super::{ GpuDevice, GpuBufferOptions, GpuMapBuffer };

/**
 * Elevation map of the world.
 */
pub(crate) struct GpuElevationMap {
  buffer: GpuMapBuffer<Elevation>,
}
impl GpuElevationMap {
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
        .with_copy_dst(true)
    );
    GpuElevationMap { buffer }
  }

  pub(crate) fn buffer(&self) -> &GpuMapBuffer<Elevation> {
    &self.buffer
  }

  pub(crate) fn dims(&self) -> WorldDims {
    self.buffer.dims()
  }

  pub(crate) fn to_persist(&self, device: &GpuDevice) -> ElevationMapPersist {
    futures::executor::block_on(async {
      let elevations =
        self.buffer
          .read_mappable_full_copy(device).await
          .to_vec_map().await
          .to_vec_of_vecs();
      ElevationMapPersist::new(elevations)
    })
  }
}
