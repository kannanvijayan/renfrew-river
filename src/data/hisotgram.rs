
#[derive(Debug, Clone)]
pub(crate) struct Histogram {
  pub(crate) data: Vec<u64>,
}

impl Histogram {
  pub(crate) fn new_empty(buckets: usize) -> Self {
    let data = vec![0; buckets];
    Self { data }
  }

  pub(crate) fn add(&mut self, bucket: usize, value: u32) {
    self.data[bucket] += value as u64;
  }

  pub(crate) fn add_from_slice(&mut self, slice: &[u32]) {
    for (i, &value) in slice.iter().enumerate() {
      self.data[i] += value as u64;
    }
  }

  pub(crate) fn value(&self, bucket: usize) -> u64 {
    self.data[bucket]
  }
}
