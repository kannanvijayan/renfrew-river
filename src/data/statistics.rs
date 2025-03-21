use crate::cog::CogBufferType;

#[derive(Debug, Clone)]
pub(crate) struct Statistics {
  pub(crate) min: i64,
  pub(crate) max: i64,
  pub(crate) sum: i64,
  pub(crate) sqsum: u64,
  pub(crate) count: u32,
}
impl Statistics {
  pub(crate) fn new_empty(buckets: usize) -> Self {
    Self {
      min: i64::MAX,
      max: i64::MIN,
      count: 0,
      sum: 0,
      sqsum: 0,
    }
  }

  pub(crate) fn add_value(&mut self, value: i64) {
    self.count += 1;
    self.sum += value;
    self.sqsum += (value as u64).pow(2);
    self.min = self.min.min(value);
    self.max = self.max.max(value);
  }

  pub(crate) fn merge(&mut self, stats: &Statistics) {
    self.count += stats.count;
    self.sum += stats.sum;
    self.sqsum += stats.sqsum;
    self.min = self.min.min(stats.min);
    self.max = self.max.max(stats.max);
  }

  pub(crate) fn range_u32(&self) -> [u32; 2] {
    assert!(self.min >= 0 && self.max >= 0, "Min and max must be >= 0");
    assert!(self.min <= self.max, "Min must be <= max");
    assert!(
      self.min <= u32::MAX as i64 && self.max <= u32::MAX as i64,
      "Min and max must be <= u32::MAX"
    );
    [
      self.min as u32,
      self.max as u32,
    ]
  }
}

impl CogBufferType for Statistics {
  type GpuType = [i64; 5];
}
impl Into<[i64; 5]> for Statistics {
  fn into(self) -> [i64; 5] {
    [
      self.min, self.max, self.sum, self.sqsum as i64,
      self.count as i64,
    ]
  }
}
impl From<[i64; 5]> for Statistics {
  fn from(data: [i64; 5]) -> Self {
    Self {
      min: data[0],
      max: data[1],
      sum: data[2],
      sqsum: data[3] as u64,
      count: data[4] as u32,
    }
  }
}
