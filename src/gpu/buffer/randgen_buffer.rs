use crate::{
  cog::{ CogDevice, CogMapBuffer },
  data::map::WorldDims,
};

#[derive(Clone)]
pub(crate) struct RandGenBuffer {
  dims: WorldDims,
  buffer: CogMapBuffer<u32>
}
impl RandGenBuffer {
  pub(crate) const NUM_ENTRIES: usize = 1;

  pub(crate) fn new(device: &CogDevice, dims: WorldDims) -> Self {
    assert!(dims.area() > 0, "Area must be > 0");

    let buffer = CogMapBuffer::new_uninit(device, dims, "");
    RandGenBuffer {
      dims,
      buffer,
    }
  }

  pub(crate) fn buffer(&self) -> &CogMapBuffer<u32> {
    &self.buffer
  }
}
