use crate::{
  persist::ElevationMapPersist,
  world::{ Elevation, WorldDims },
};
use super::{ GpuDevice, GpuBufferOptions, GpuMapBuffer, GpuSeqBuffer };

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

  pub(crate) fn from_persist(
    device: &GpuDevice,
    world_dims: WorldDims,
    persist: &ElevationMapPersist
  ) -> Self {
    let elevation_map = GpuElevationMap::new(device, world_dims, "ElevationMap");

    futures::executor::block_on(async {
      let elev_vec: Vec<_> =
        persist.elevations()
          .iter()
          .flat_map(|v| v.iter())
          .copied()
          .collect();
      let tmp_buffer = GpuSeqBuffer::from_iter_for_write(
        device,
        elev_vec.as_slice().iter()
      ).await;

      let mut encoder = device.device().create_command_encoder(
        &wgpu::CommandEncoderDescriptor {
          label: Some("ElevationMapFromPersistEncoder"),
        }
      );
      encoder.copy_buffer_to_buffer(
        tmp_buffer.wgpu_buffer(), 0,
        elevation_map.buffer().wgpu_buffer(), 0,
        tmp_buffer.wgpu_buffer().size()
      );

      let submission_index = device.queue().submit(Some(encoder.finish()));
      device.device().poll(wgpu::Maintain::WaitForSubmissionIndex(submission_index));
    });

    elevation_map
  }
}
