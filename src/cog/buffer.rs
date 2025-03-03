use std::{ marker::PhantomData, mem, rc::Rc };
use bytemuck::Pod;
use futures;
use crate::world::{ CellCoord, WorldDims };

use super::CogDevice;

pub(crate) trait CogBufferType
  : Clone
  + Into<Self::GpuType>
  + From<Self::GpuType>
{
  type GpuType: Pod;
}

#[derive(Clone)]
struct CogBufferBase {
  device: CogDevice,
  buffer: Rc<wgpu::Buffer>,
}
impl CogBufferBase {
  fn new(device: &CogDevice, buffer: wgpu::Buffer) -> CogBufferBase {
    let buffer = Rc::new(buffer);
    CogBufferBase { device: device.clone(), buffer }
  }
}

pub(crate) struct CogSeqBuffer<T: CogBufferType> {
  base: CogBufferBase,
  len: usize,
  _phantom: PhantomData<T>,
}
impl<T: CogBufferType> CogSeqBuffer<T> {
  const ELEM_SIZE: usize = mem::size_of::<T::GpuType>();

  pub(crate) fn new_uninit(
    device: &CogDevice,
    len: usize,
    label: &'static str,
  ) -> CogSeqBuffer<T> {
    let size = (len as u64) * (Self::ELEM_SIZE as u64);
    let usage = {
      use wgpu::BufferUsages as BU;
      BU::COPY_SRC | BU::COPY_DST | BU::STORAGE
    };
    let buffer = device.wgpu_device().create_buffer(&wgpu::BufferDescriptor {
      label: Some(label),
      size,
      usage,
      mapped_at_creation: false,
    });
    let device: CogDevice = device.clone();
    let base = CogBufferBase::new(&device, buffer);
    CogSeqBuffer { base, len, _phantom: PhantomData }
  }

  pub(crate) async fn new_from_slice(
    device: &CogDevice,
    data: &[T],
    label: &'static str,
  ) -> CogSeqBuffer<T> {
    let len = data.len();
    let buffer = CogSeqBuffer::new_uninit(device, len, label);
    buffer.write_slice(0, &data);
    buffer
  }

  pub(crate) fn len(&self) -> usize {
    self.len
  }

  pub(crate) fn wgpu_buffer(&self) -> &wgpu::Buffer {
    &self.base.buffer
  }

  /**
   * Cast this buffer to a buffer over a different type.
   * The other type must have the same size as this type.
   */
  pub(crate) fn cast_as<U: CogBufferType>(&self) -> &CogSeqBuffer<U> {
    assert!(Self::ELEM_SIZE == mem::size_of::<U>());
    unsafe { &*(self as *const CogSeqBuffer<T> as *const CogSeqBuffer<U>) }
  }

  fn read_mappable_copy_buffer(&self, offset: usize, len: usize) -> wgpu::Buffer {
    assert!(offset + len <= self.len);
    let byte_offset = (offset * Self::ELEM_SIZE) as u64;
    let byte_size = (len * Self::ELEM_SIZE) as u64;
    let new_buffer = self.base.device.wgpu_device().create_buffer(
      &wgpu::BufferDescriptor {
        label: Some("ReadMappableCopyBuffer"),
        size: byte_size,
        usage: wgpu::BufferUsages::COPY_DST | wgpu::BufferUsages::MAP_READ,
        mapped_at_creation: false,
      }
    );
    self.base.device.run_encoder("ReadMappableCopyEncoder", |encoder| {
      encoder.copy_buffer_to_buffer(
        self.wgpu_buffer(),
        byte_offset,
        &new_buffer,
        0,
        byte_size,
      );
    });
    new_buffer
  }

  /**
   * Evaluate the given function with a reference to an iterator over all the
   * data in the buffer.
   */
  pub(crate) fn read_vec<R, I>(&self, offset: usize, len: usize) -> Vec<T> {
    use futures::{ channel, executor };
    assert!(offset + len <= self.len);
    let copy_buffer = self.read_mappable_copy_buffer(offset, len);
    let (mapped_send, mapped_recv) = channel::oneshot::channel::<bool>();
    executor::block_on(async {
      let slice = copy_buffer.slice(..);
      slice.map_async(wgpu::MapMode::Read, |result| {
        if result.is_ok() {
          mapped_send.send(true).unwrap();
        } else {
          panic!("Failed to map buffer for reading.");
        }
      });
      mapped_recv.await.unwrap();
      let view = slice.get_mapped_range();
      let data = bytemuck::cast_slice::<u8, T::GpuType>(&view);
      data.iter().map(|&x| T::from(x)).collect()
    })
  }

  pub(crate) fn write_slice(&self, offset: usize, vals: &[T]) {
    assert!(offset + vals.len() <= self.len);
    let byte_offset = (offset * Self::ELEM_SIZE) as u64;
    let byte_size = (vals.len() * Self::ELEM_SIZE) as u64;
    let new_buffer = self.base.device.wgpu_device().create_buffer(
      &wgpu::BufferDescriptor {
        label: Some("WriteBuffer"),
        size: byte_size,
        usage: wgpu::BufferUsages::COPY_SRC,
        mapped_at_creation: true,
      }
    );
    {
      let slice = new_buffer.slice(..);
      let mut view = slice.get_mapped_range_mut();
      for (view, val) in view.chunks_exact_mut(Self::ELEM_SIZE).zip(vals.iter()) {
        let gpu_val: T::GpuType = val.clone().into();
        view.copy_from_slice(bytemuck::bytes_of(&gpu_val));
      }
    }
    new_buffer.unmap();
    self.base.device.run_encoder("WriteSeqBuffer", |encoder| {
      encoder.copy_buffer_to_buffer(
        &new_buffer,
        0,
        self.wgpu_buffer(),
        byte_offset,
        byte_size,
      );
    });
  }
}

impl<T: CogBufferType> Clone for CogSeqBuffer<T> {
  fn clone(&self) -> Self {
    CogSeqBuffer {
      base: self.base.clone(),
      len: self.len,
      _phantom: PhantomData,
    }
  }
}


pub(crate) struct CogMapBuffer<T: CogBufferType> {
  base: CogBufferBase,
  dims: WorldDims,
  _phantom: PhantomData<T>,
}
impl<T: CogBufferType> CogMapBuffer<T> {
  const ELEM_SIZE: usize = mem::size_of::<T::GpuType>();

  pub(crate) fn new_uninit(
    device: &CogDevice,
    dims: WorldDims,
    label: &'static str,
  ) -> CogMapBuffer<T> {
    let size = (dims.area() as u64) * (Self::ELEM_SIZE as u64);
    let usage = {
      use wgpu::BufferUsages as BU;
      BU::COPY_SRC | BU::COPY_DST | BU::STORAGE
    };
    let buffer = device.wgpu_device().create_buffer(&wgpu::BufferDescriptor {
      label: Some(label),
      size,
      usage,
      mapped_at_creation: false,
    });
    let device: CogDevice = device.clone();
    let base = CogBufferBase::new(&device, buffer);
    CogMapBuffer { base, dims, _phantom: PhantomData }
  }

  pub(crate) async fn new_from_slice(
    device: &CogDevice,
    dims: WorldDims,
    values: &[T],
    label: &'static str,
  ) -> CogMapBuffer<T> {
    assert!(dims.area() as usize == values.len());
    let buffer = CogMapBuffer::new_uninit(device, dims, label);
    buffer.write_area(CellCoord::zero(), dims, values);
    buffer
  }

  pub(crate) fn dims(&self) -> WorldDims {
    self.dims
  }

  pub(crate) fn wgpu_buffer(&self) -> &wgpu::Buffer {
    &self.base.buffer
  }

  /**
   * Cast this buffer to a buffer over a different type.
   * The other type must have the same size as this type.
   */
  pub(crate) fn cast_as<U: CogBufferType>(&self) -> &CogMapBuffer<U> {
    assert!(Self::ELEM_SIZE == mem::size_of::<U>());
    unsafe { &*(self as *const CogMapBuffer<T> as *const CogMapBuffer<U>) }
  }

  fn read_mappable_copy_buffer(&self) -> wgpu::Buffer {
    let byte_size = (self.dims.area() as usize * Self::ELEM_SIZE) as u64;
    let new_buffer = self.base.device.wgpu_device().create_buffer(
      &wgpu::BufferDescriptor {
        label: Some("ReadMappableCopyBuffer"),
        size: byte_size,
        usage: wgpu::BufferUsages::COPY_DST | wgpu::BufferUsages::MAP_READ,
        mapped_at_creation: false,
      }
    );
    self.base.device.run_encoder("ReadMappableCopyEncoder", |encoder| {
      encoder.copy_buffer_to_buffer(
        self.wgpu_buffer(),
        0,
        &new_buffer,
        0,
        byte_size,
      );
    });
    new_buffer
  }

  /**
   * Evaluate the given function with a reference to an iterator over all the
   * data in the buffer.
   */
  pub(crate) fn read_area(&self, coord: CellCoord, dims: WorldDims) -> Vec<T> {
    use futures::{ channel, executor };
    assert!(self.dims.contains_coord(coord));
    assert!(self.dims.contains_or_bounded_by_coord(coord.extend(dims)));
    let copy_buffer = self.read_mappable_copy_buffer();
    let (mapped_send, mapped_recv) = channel::oneshot::channel::<bool>();
    executor::block_on(async {
      let slice = copy_buffer.slice(..);
      slice.map_async(wgpu::MapMode::Read, |result| {
        if result.is_ok() {
          mapped_send.send(true).unwrap();
        } else {
          panic!("Failed to map buffer for reading.");
        }
      });
      mapped_recv.await.unwrap();
      let view = slice.get_mapped_range();
      let src_data = bytemuck::cast_slice::<u8, T::GpuType>(&view);
      let mut dst_data = Vec::with_capacity(dims.area() as usize);
      for row in 0 .. dims.rows_u32() {
        for col in 0 .. dims.columns_u32() {
          let src_index = self.dims.coord_index(
            coord.add_xy(col as u16, row as u16)
          ) as usize;
          let dst_index = dims.coord_index(
            CellCoord::new(col as u16, row as u16)
          ) as usize;
          let val: T = src_data[src_index].into();
          dst_data.push(val);
        }
      }
      dst_data
    })
  }

  pub(crate) fn write_area(&self, coord: CellCoord, dims: WorldDims, vals: &[T]) {
    assert!(self.dims.contains_coord(coord));
    assert!(self.dims.contains_or_bounded_by_coord(coord.extend(dims)));
    let byte_size = self.dims.area() as usize * Self::ELEM_SIZE;
    let new_buffer = self.base.device.wgpu_device().create_buffer(
      &wgpu::BufferDescriptor {
        label: Some("WriteBuffer"),
        size: byte_size as u64,
        usage: wgpu::BufferUsages::COPY_SRC,
        mapped_at_creation: true,
      }
    );
    {
      let slice = new_buffer.slice(..);
      let mut view = slice.get_mapped_range_mut();
      for row in 0 .. dims.rows_u32() {
        for col in 0 .. dims.columns_u32() {
          let src_index = dims.coord_index(
            CellCoord::new(col as u16, row as u16)
          ) as usize;
          let dst_index = self.dims.coord_index(
            coord.add_xy(col as u16, row as u16)
          ) as usize;
          let gpu_val: T::GpuType = vals[src_index].clone().into();
          let dst_view = &mut view[
            (dst_index * Self::ELEM_SIZE) .. ((dst_index + 1) * Self::ELEM_SIZE)
          ];
          dst_view.copy_from_slice(bytemuck::bytes_of(&gpu_val));
        }
      }
    }
    new_buffer.unmap();
    self.base.device.run_encoder("WriteSeqBuffer", |encoder| {
      encoder.copy_buffer_to_buffer(
        &new_buffer,
        0,
        self.wgpu_buffer(),
        0,
        byte_size as u64,
      );
    });
  }
}

impl<T: CogBufferType> Clone for CogMapBuffer<T> {
  fn clone(&self) -> Self {
    CogMapBuffer {
      base: self.base.clone(),
      dims: self.dims,
      _phantom: PhantomData,
    }
  }
}
