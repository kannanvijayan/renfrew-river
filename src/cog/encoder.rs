use std::mem;

use super::{
  buffer::CogBufferBase,
  CogBufferType,
  CogDevice,
};

pub(crate) struct CogEncoder {
  device: CogDevice,
  wgpu_encoder: wgpu::CommandEncoder,
}
impl CogEncoder {
  pub(crate) fn new(device: CogDevice, name: &str) -> Self {
    let encoder = device.make_wgpu_encoder(Some(name));
    Self { device, wgpu_encoder: encoder }
  }
  pub(crate) fn finish(self) -> wgpu::CommandBuffer {
    self.wgpu_encoder.finish()
  }
  pub(crate) fn device(&self) -> &CogDevice {
    &self.device
  }

  pub(crate) fn wgpu_begin_compute_pass(&mut self, label: &str)
    -> wgpu::ComputePass
  {
    self.wgpu_encoder.begin_compute_pass(
      &wgpu::ComputePassDescriptor { label: Some(label) }
    )
  }

  pub(crate) fn copy_buffer_to_buffer<T: CogBufferType>(
    &mut self,
    src: &CogBufferBase,
    src_index: usize,
    dst: &CogBufferBase,
    dst_index: usize,
    size: usize,
  ) {
    let elem_size = mem::size_of::<T::GpuType>();
    self.wgpu_encoder.copy_buffer_to_buffer(
      src.wgpu_buffer(),
      (src_index * elem_size) as u64,
      dst.wgpu_buffer(),
      (dst_index * elem_size) as u64,
      (size * elem_size) as u64,
    );
  }
}
