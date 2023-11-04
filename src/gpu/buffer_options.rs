use wgpu;

use crate::gpu::GpuDevice;

pub(crate) struct GpuBufferOptions {
  pub(crate) label: Option<&'static str>,
  pub(crate) copy_src: bool,
  pub(crate) copy_dst: bool,
  pub(crate) map_read: bool,
  pub(crate) map_write: bool,
  pub(crate) storage: bool,
}
impl GpuBufferOptions {
  pub(crate) fn empty() -> Self {
    GpuBufferOptions {
      label: None,
      copy_src: false,
      copy_dst: false,
      map_read: false,
      map_write: false,
      storage: false,
    }
  }
  pub(crate) fn with_label(mut self, label: &'static str) -> Self {
    self.label = Some(label);
    self
  }
  pub(crate) fn with_copy_src(mut self, copy_src: bool) -> Self {
    self.copy_src = copy_src;
    self
  }
  pub(crate) fn with_copy_dst(mut self, copy_dst: bool) -> Self {
    self.copy_dst = copy_dst;
    self
  }
  pub(crate) fn with_map_read(mut self, map_read: bool) -> Self {
    self.map_read = map_read;
    self
  }
  pub(crate) fn with_map_write(mut self, map_write: bool) -> Self {
    self.map_write = map_write;
    self
  }
  pub(crate) fn with_storage(mut self, storage: bool) -> Self {
    self.storage = storage;
    self
  }
  pub(crate) fn to_wgpu_usages(&self) -> wgpu::BufferUsages {
    let mut usage = wgpu::BufferUsages::empty();
    if self.copy_src { usage |= wgpu::BufferUsages::COPY_SRC; }
    if self.copy_dst { usage |= wgpu::BufferUsages::COPY_DST; }
    if self.map_read { usage |= wgpu::BufferUsages::MAP_READ; }
    if self.map_write { usage |= wgpu::BufferUsages::MAP_WRITE; }
    if self.storage { usage |= wgpu::BufferUsages::STORAGE; }
    usage
  }
  pub(crate) fn create_wgpu_buffer(&self, device: &GpuDevice, size: u64)
    -> wgpu::Buffer
  {
    device.create_buffer(size, self.to_wgpu_usages(), self.label)
  }
}

impl Default for GpuBufferOptions {
  fn default() -> Self {
    GpuBufferOptions::empty()
  }
}
