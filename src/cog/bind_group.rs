use std::{ num::NonZero, mem };
use super::{
  CogBufferBase,
  CogBufferType,
  CogDevice,
  CogMapBuffer,
  CogSeqBuffer,
};


pub(crate) struct CogBindGroup {
  wgpu_layout: wgpu::BindGroupLayout,
  entries: Vec<CogBindGroupEntry>,
}
impl CogBindGroup {
  pub(crate) fn to_wgpu_bind_group(&self, device: &CogDevice) -> wgpu::BindGroup {
    let entries =
      self.entries.iter()
        .map(|entry| entry.to_wgpu_bind_group_entry())
        .collect::<Vec<_>>();

    device.wgpu_device().create_bind_group(
      &wgpu::BindGroupDescriptor {
        layout: &self.wgpu_layout,
        entries: &entries,
        label: None,
      })
  }
}

pub(crate) struct CogBindGroupEntry {
  pub(crate) binding: u32,
  pub(crate) offset: u64,
  pub(crate) size: u64,
  pub(crate) buffer: CogBufferBase
}
impl CogBindGroupEntry {
  pub(crate) fn to_wgpu_bind_group_entry(&self) -> wgpu::BindGroupEntry {
    let buffer = self.buffer.wgpu_buffer();
    wgpu::BindGroupEntry {
      binding: self.binding,
      resource: wgpu::BindingResource::Buffer(wgpu::BufferBinding {
        buffer: &buffer,
        offset: self.offset,
        size: NonZero::new(self.size),
      }),
    }
  }
}

pub(crate) struct CogBindGroupBuilder {
  pub(crate) device: CogDevice,
  pub(crate) wgpu_layout: wgpu::BindGroupLayout,
  pub(crate) num_entries: u32,
  pub(crate) entries: Vec<CogBindGroupEntry>,
}
impl CogBindGroupBuilder {
  pub(crate) fn new(
    device: &CogDevice,
    wgpu_layout: wgpu::BindGroupLayout,
    num_entries: u32,
 ) -> Self {
    let device = device.clone();
    Self { device, wgpu_layout, num_entries, entries: Vec::new() }
  }

  fn add_buffer(mut self,
    buffer: &CogBufferBase,
    offset: u64,
    size: u64,
  ) -> Self {
    let binding = self.entries.len() as u32;
    let buffer = buffer.clone();
    self.entries.push(CogBindGroupEntry { binding, offset, buffer, size });
    self
  }

  pub(crate) fn add_uniform_buffer(self, buffer: &CogBufferBase) -> Self {
    self.add_buffer(buffer, 0, buffer.wgpu_buffer().size())
  }

  pub(crate) fn add_seq_buffer<T: CogBufferType>(self,
    buffer: &CogSeqBuffer<T>,
  ) -> Self {
    let size = (buffer.len() * mem::size_of::<T::GpuType>()) as u64;
    self.add_buffer(&buffer.base, 0, size)
  }

  pub(crate) fn add_map_buffer<T: CogBufferType>(self,
    buffer: &CogMapBuffer<T>,
  ) -> Self {
    let size =
      (buffer.dims().area() as usize * mem::size_of::<T::GpuType>()) as u64;
    self.add_buffer(&buffer.base, 0, size)
  }

  pub(crate) fn build(self) -> CogBindGroup {
    debug_assert!(self.entries.len() <= self.num_entries as usize);
    if self.entries.len() != self.num_entries as usize {
      panic!("Wrong number of buffer binding entries in group");
    }
    let wgpu_layout = self.wgpu_layout;
    let entries = self.entries;
    CogBindGroup { wgpu_layout, entries }
  }
}

/*
    let wgpu_bind_group = self.device.wgpu_device().create_bind_group(
      &wgpu::BindGroupDescriptor {
        layout: &self.wgpu_layout,
        entries: &self.entries,
        label: None,
      });
*/
