use crate::{
  persist::{ UnitsListPersist, UnitPersist },
  world::{ UnitData, UnitId },
};
use super::{ GpuDevice, GpuBufferOptions, GpuSeqBuffer };

/**
 * Elevation map of the world.
 */
pub(crate) struct GpuUnitsList {
  buffer: GpuSeqBuffer<UnitData>,
}
impl GpuUnitsList {
  pub(crate) fn new(device: &GpuDevice, length: usize, label: &'static str)
    -> Self
  {
    let buffer = GpuSeqBuffer::new(
      device,
      length,
      GpuBufferOptions::empty()
        .with_label(label)
        .with_storage(true)
        .with_copy_src(true)
    );
    GpuUnitsList { buffer }
  }

  pub(crate) fn buffer(&self) -> &GpuSeqBuffer<UnitData> {
    &self.buffer
  }

  pub(crate) fn to_persist(&self, device: &GpuDevice) -> UnitsListPersist {
    futures::executor::block_on(async {
      let unit_entries =
        self.buffer
          .read_mappable_full_copy(device).await
          .to_vec().await;
      let mut units = Vec::with_capacity(unit_entries.len());
      for (idx, unit) in unit_entries.into_iter().enumerate() {
        if unit.is_invalid() {
          continue;
        }
        let unit_id = UnitId::from_u32(idx as u32);
        let unit_persist = UnitPersist::new(unit_id, unit);
        units.push(unit_persist);
      }
      UnitsListPersist::new(units)
    })
  }
}
