use std::{ marker::PhantomData, mem };
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
  pub(crate) fn new(device: &CogDevice, label: &str, value: T) -> Self {
    let size = mem::size_of::<T::GpuType>();
    let pod_value = value.into();
    let bytes = bytemuck::bytes_of(&pod_value);
    let usage = BufferUsages::UNIFORM | BufferUsages::COPY_DST;
    let wgpu_buffer = device.create_wgpu_buffer_init(bytes, usage, Some(label));
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
