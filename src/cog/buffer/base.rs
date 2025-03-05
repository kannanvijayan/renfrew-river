use std::rc::Rc;
use crate::cog::CogDevice;

#[derive(Clone)]
pub(crate) struct CogBufferBase {
  device: CogDevice,
  buffer: Rc<wgpu::Buffer>,
}
impl CogBufferBase {
  pub(crate) fn new(device: &CogDevice, buffer: wgpu::Buffer) -> CogBufferBase {
    let buffer = Rc::new(buffer);
    CogBufferBase { device: device.clone(), buffer }
  }

  fn new_sized_impl(
    device: &CogDevice,
    size: u64,
    usage: wgpu::BufferUsages,
    label: &str,
    mapped_at_creation: bool,
  ) -> Self {
    let buffer = device.wgpu_device().create_buffer(&wgpu::BufferDescriptor {
      label: Some(label),
      size,
      usage,
      mapped_at_creation,
    });
    let device: CogDevice = device.clone();
    CogBufferBase::new(&device, buffer)
  }

  pub(crate) fn new_sized_uninit(
    device: &CogDevice,
    size: u64,
    usage: wgpu::BufferUsages,
    label: &str,
  ) -> Self {
    CogBufferBase::new_sized_impl(device, size, usage, label, false)
  }

  pub(crate) fn new_sized_uninit_mapped(
    device: &CogDevice,
    size: u64,
    usage: wgpu::BufferUsages,
    label: &str,
  ) -> Self {
    CogBufferBase::new_sized_impl(device, size, usage, label, true)
  }

  pub(crate) fn device(&self) -> &CogDevice {
    &self.device
  }

  pub(crate) fn wgpu_buffer(&self) -> &wgpu::Buffer {
    &self.buffer
  }
}
