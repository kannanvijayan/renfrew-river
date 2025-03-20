use crate::{
  cog::{ CogDevice, CogSeqBuffer },
  world::{ Histogram, WorldDims },
};

/**
 * Buffer that holds histogram data for a map.
 */
#[derive(Clone)]
pub(crate) struct HistogramBuffer {
  dims: WorldDims,
  num_buckets: u32,
  buffer: CogSeqBuffer<u32>
}
impl HistogramBuffer {
  pub(crate) fn new(device: &CogDevice, dims: WorldDims, num_buckets: u32)
    -> Self
  {
    assert!(dims.area() > 0, "Area must be > 0");
    assert!(num_buckets > 0, "Number of buckets must be > 0");

    let size = dims.area() as usize * num_buckets as usize;

    let buffer = CogSeqBuffer::new_uninit(device, size, "HistogramBuf");
    HistogramBuffer {
      dims,
      num_buckets,
      buffer,
    }
  }

  pub(crate) fn buffer(&self) -> &CogSeqBuffer<u32> {
    &self.buffer
  }

  pub(crate) fn compute_histogram(&self) -> Histogram {
    self.buffer.read_mapped_full(|gpudata_slice| {
      let mut histogram = Histogram::new_empty(self.num_buckets as usize);
      self.dims.each_index_by_row(|cell_idx, _coord| {
        let bucket_idx = (cell_idx as usize) * (self.num_buckets as usize);
        histogram.add_from_slice(
          &gpudata_slice[bucket_idx..bucket_idx + self.num_buckets as usize],
        );
      });
      histogram
    })
  }
}
