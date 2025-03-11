use std::{ iter::repeat, marker::PhantomData, mem };
use bytemuck::Pod;
use wgpu::BufferUsages;
use crate::cog::CogDevice;
use super::CogBufferBase;

/**
 * A rust type that can be used as an element type for CogUniformBuffers.
 */
pub(crate) trait CogUniformType: Into<Self::GpuType>
{
  type GpuType: Pod;
}

pub(crate) struct CogUniformBuffer<T: CogUniformType> {
  pub(crate) base: CogBufferBase,
  size: usize,
  _phantom: PhantomData<T>,
}
impl<T: CogUniformType> CogUniformBuffer<T> {
  pub(crate) const MIN_BUFFER_SIZE: usize = 64;

  pub(crate) fn new(device: &CogDevice, label: &str, value: T) -> Self {
    let pod_value = value.into();
    let usage = BufferUsages::UNIFORM | BufferUsages::COPY_DST;
    let bytes = bytemuck::bytes_of(&pod_value);
    let (wgpu_buffer, size) = if bytes.len() >= Self::MIN_BUFFER_SIZE {
      let device = device.create_wgpu_buffer_init(bytes, usage, Some(label));
      (device, bytes.len())
    } else {
      let mut padded_bytes = Vec::with_capacity(Self::MIN_BUFFER_SIZE);
      padded_bytes.extend_from_slice(bytes);
      padded_bytes.extend(repeat(0).take(Self::MIN_BUFFER_SIZE - bytes.len()));
      let device = device.create_wgpu_buffer_init(&padded_bytes, usage, Some(label));
      (device, Self::MIN_BUFFER_SIZE)
    };
    let base = CogBufferBase::new(device, wgpu_buffer);
    CogUniformBuffer { base, size, _phantom: PhantomData }
  }

  pub(crate) fn size(&self) -> usize {
    self.size
  }

  pub(crate) fn wgpu_buffer(&self) -> &wgpu::Buffer {
    self.base.wgpu_buffer()
  }

}
