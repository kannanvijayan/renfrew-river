
#[derive(Debug, Clone)]
pub(crate) struct Histogram {
  pub(crate) data: Vec<i64>,
}

impl Histogram {
  pub(crate) fn new_empty(buckets: usize) -> Self {
    let data = vec![0; buckets];
    Self { data }
  }

  pub(crate) fn add(&mut self, bucket: usize, value: i32) {
    self.data[bucket] += value as i64;
  }

  pub(crate) fn add_from_slice(&mut self, slice: &[i32]) {
    for (i, &value) in slice.iter().enumerate() {
      self.data[i] += value as i64;
    }
  }

  pub(crate) fn value(&self, bucket: usize) -> i64 {
    self.data[bucket]
  }
}
