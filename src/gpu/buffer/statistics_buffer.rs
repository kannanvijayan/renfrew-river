use crate::{
  cog::{ CogDevice, CogMapBuffer, CogSeqBuffer },
  data::{ map::WorldDims, Statistics },
};

/**
 * Buffer that holds histogram data for a map.
 */
#[derive(Clone)]
pub(crate) struct StatisticsMapBuffer {
  dims: WorldDims,
  buffer: CogMapBuffer<Statistics>
}
impl StatisticsMapBuffer {
  pub(crate) fn new(device: &CogDevice, dims: WorldDims)
    -> Self
  {
    assert!(dims.area() > 0, "Area must be > 0");

    let buffer = CogMapBuffer::new_uninit(device, dims, "StatisticsMapBuf");
    StatisticsMapBuffer { dims, buffer }
  }

  pub(crate) fn dims(&self) -> &WorldDims {
    &self.dims
  }

  pub(crate) fn buffer(&self) -> &CogMapBuffer<Statistics> {
    &self.buffer
  }

  pub(crate) fn compute_statistics(&self) -> Statistics {
    self.buffer.as_seq_buffer().read_mapped_full(|gpudata_slice| {
      let mut result = Statistics::new_empty(self.dims.area() as usize);
      for gpudata in gpudata_slice.iter() {
        result.merge(&Statistics::from(*gpudata));
      }
      result
    })
  }
}
