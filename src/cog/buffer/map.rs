use std::{ marker::PhantomData, mem };
use futures;
use crate::{
  cog::{ CogSeqBuffer, CogDevice },
  world::{ CellCoord, WorldDims },
};
use super::{ CogBufferBase, CogBufferType };

pub(crate) struct CogMapBuffer<T: CogBufferType> {
  pub(crate) base: CogBufferBase,
  dims: WorldDims,
  _phantom: PhantomData<T>,
}
impl<T: CogBufferType> CogMapBuffer<T> {
  const ELEM_SIZE: usize = mem::size_of::<T::GpuType>();

  pub(crate) fn new_uninit(
    device: &CogDevice,
    dims: WorldDims,
    label: &str,
  ) -> CogMapBuffer<T> {
    let size = (dims.area() as u64) * (Self::ELEM_SIZE as u64);
    let usage = {
      use wgpu::BufferUsages as BU;
      BU::COPY_SRC | BU::COPY_DST | BU::STORAGE
    };
    let base = CogBufferBase::new_sized_uninit(&device, size, usage, label);
    CogMapBuffer { base, dims, _phantom: PhantomData }
  }

  pub(crate) async fn new_from_slice(
    device: &CogDevice,
    dims: WorldDims,
    values: &[T],
    label: &str,
  ) -> CogMapBuffer<T> {
    assert!(dims.area() as usize == values.len());
    let mut buffer = CogMapBuffer::new_uninit(device, dims, label);
    buffer.write_mapped(CellCoord::zero(), dims, |map| {
      let mut map = map;
      for (i, value) in values.iter().enumerate() {
        let coord = dims.index_coord(i);
        map.set(coord, value.clone());
      }
    });
    buffer
  }

  pub(crate) fn dims(&self) -> WorldDims {
    self.dims
  }

  /**
   * Cast this buffer to a buffer over a different type.
   * The other type must have the same size as this type.
   */
  pub(crate) fn cast_as<U: CogBufferType>(&self) -> &CogMapBuffer<U> {
    assert!(Self::ELEM_SIZE == mem::size_of::<U>());
    unsafe { &*(self as *const CogMapBuffer<T> as *const CogMapBuffer<U>) }
  }

  /**
   * Convert to a sequential buffer handle.
   */
  pub(crate) fn as_seq_buffer(&self) -> CogSeqBuffer<T> {
    CogSeqBuffer::new(self.base.clone(), self.dims.area() as usize)
  }

  fn read_mapped<R, F>(&self, top_left: CellCoord, dims: WorldDims, func: F) -> R
    where F: FnOnce(CogBufferReadMap<T>) -> R
  {
    let area = self.dims.area() as usize;
    let byte_size = (area * Self::ELEM_SIZE) as u64;
    let new_buffer = CogBufferBase::new_sized_uninit_mapped(
      self.base.device(),
      byte_size,
      wgpu::BufferUsages::COPY_DST | wgpu::BufferUsages::MAP_READ,
      "ReadMappedBuffer",
    );
    self.base.device().encode_and_run("ReadMappableCopyEncoder", |encoder| {
      if dims == self.dims {
        // Single copy if the dimensions match.
        encoder.copy_buffer_to_buffer::<T>(
          &self.base, 0,
          &new_buffer, 0,
          area
        );
      } else {
        // Copy each row separately if the dimensions don't match.
        for row in 0 .. dims.rows_u16() {
          let src_row_offset = top_left.add_xy(0, row);
          let src_offset = self.dims.coord_index(src_row_offset) as usize;

          let dst_row_offset = CellCoord::new(0, row);
          let dst_offset = dims.coord_index(dst_row_offset) as usize;

          let row_size = dims.columns_u32() as usize * Self::ELEM_SIZE;
          encoder.copy_buffer_to_buffer::<T>(
            &self.base,
            src_offset,
            &new_buffer,
            dst_offset,
            row_size,
          );
        }
      }
    });

    let buffer_read = BufferRead::<T> {
      base: new_buffer,
      dims,
      _phantom: PhantomData,
    };
    buffer_read.with_map(|map| func(map))
  }

  fn write_mapped(&self,
    top_left: CellCoord,
    dims: WorldDims,
    func: impl FnOnce(CogBufferWriteMap<T>)
  ) {
    let area = self.dims.area() as usize;
    let byte_size = (area * Self::ELEM_SIZE) as u64;
    let new_buffer = CogBufferBase::new_sized_uninit_mapped(
      self.base.device(),
      byte_size,
      wgpu::BufferUsages::COPY_SRC | wgpu::BufferUsages::MAP_WRITE,
      "WriteMappedBuffer",
    );
    let buffer_write = BufferWrite::<T> {
      base: new_buffer.clone(),
      dims,
      _phantom: PhantomData,
    };
    buffer_write.with_map(|map| func(map));

    self.base.device().encode_and_run("WriteMappedEncoder", |encoder| {
      if dims == self.dims {
        // Single copy if the dimensions match.
        encoder.copy_buffer_to_buffer::<T>(
          &new_buffer, 0,
          &self.base, 0,
          area
        );
      } else {
        // Copy each row separately if the dimensions don't match.
        for row in 0 .. dims.rows_u16() {
          let src_row_offset = CellCoord::new(0, row);
          let src_offset = dims.coord_index(src_row_offset) as usize;

          let dst_row_offset = top_left.add_xy(0, row);
          let dst_offset = self.dims.coord_index(dst_row_offset) as usize;

          let row_size = dims.columns_u32() as usize * Self::ELEM_SIZE;
          encoder.copy_buffer_to_buffer::<T>(
            &new_buffer,
            src_offset,
            &self.base,
            dst_offset,
            row_size,
          );
        }
      }
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


struct BufferRead<T: CogBufferType> {
  base: CogBufferBase,
  dims: WorldDims,
  _phantom: PhantomData<T>,
}
impl<T: CogBufferType> BufferRead<T> {
  const ELEM_SIZE: usize = mem::size_of::<T::GpuType>();

  pub(crate) fn new_uninit(
    device: &CogDevice,
    dims: WorldDims,
    label: &str
  ) -> BufferRead<T> {
    use wgpu::BufferUsages as BU;
    let size = (dims.area() as u64) * (Self::ELEM_SIZE as u64);
    let usage = BU::COPY_DST | BU::MAP_READ;
    let base = CogBufferBase::new_sized_uninit(device, size, usage, label);
    BufferRead { base, dims, _phantom: PhantomData }
  }

  fn with_map<R, F>(&self, func: F) -> R
    where F: FnOnce(CogBufferReadMap<T>) -> R
  {
    use futures::{ channel, executor };
    let (mapped_send, mapped_recv) = channel::oneshot::channel::<bool>();
    let result = executor::block_on(async {
      let slice = self.base.wgpu_buffer().slice(..);
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
      let map = CogBufferReadMap::new(self.dims, data);
      let result = func(map);
      self.base.wgpu_buffer().unmap();
      result
    });
    result
  }

  pub(crate) fn dims(&self) -> WorldDims {
    self.dims
  }
}

struct CogBufferReadMap<'a, T: CogBufferType> {
  dims: WorldDims,
  data: &'a [T::GpuType],
}
impl<'a, T: CogBufferType> CogBufferReadMap<'a, T> {
  pub(crate) fn new(dims: WorldDims, data: &'a [T::GpuType])
    -> CogBufferReadMap<'a, T>
  {
    CogBufferReadMap { dims, data }
  }

  pub(crate) fn dims(&self) -> WorldDims {
    self.dims
  }

  pub(crate) fn get(&self, coord: CellCoord) -> T {
    let index = self.dims.coord_index(coord) as usize;
    T::from(self.data[index])
  }
}

struct BufferWrite<T: CogBufferType> {
  base: CogBufferBase,
  dims: WorldDims,
  _phantom: PhantomData<T>,
}
impl<T: CogBufferType> BufferWrite<T> {
  const ELEM_SIZE: usize = mem::size_of::<T::GpuType>();

  pub(crate) fn new_uninit(
    device: &CogDevice,
    dims: WorldDims,
    label: &str
  ) -> BufferWrite<T> {
    use wgpu::BufferUsages as BU;
    let size = (dims.area() as u64) * (Self::ELEM_SIZE as u64);
    let usage = BU::COPY_SRC | BU::MAP_WRITE;
    let base = CogBufferBase::new_sized_uninit(device, size, usage, label);
    BufferWrite { base, dims, _phantom: PhantomData }
  }

  fn with_map<R, F>(&self, func: F) -> R
    where F: FnOnce(CogBufferWriteMap<T>) -> R
  {
    use futures::{ channel, executor };
    let (mapped_send, mapped_recv) = channel::oneshot::channel::<bool>();
    let result = executor::block_on(async {
      let slice = self.base.wgpu_buffer().slice(..);
      slice.map_async(wgpu::MapMode::Write, |result| {
        if result.is_ok() {
          mapped_send.send(true).unwrap();
        } else {
          panic!("Failed to map buffer for writing.");
        }
      });
      mapped_recv.await.unwrap();
      let mut view = slice.get_mapped_range_mut();
      let data = bytemuck::cast_slice_mut::<u8, T::GpuType>(&mut view);
      let map = CogBufferWriteMap::new(self.dims, data);
      let result = func(map);
      self.base.wgpu_buffer().unmap();
      result
    });
    result
  }

  pub(crate) fn dims(&self) -> WorldDims {
    self.dims
  }
}

struct CogBufferWriteMap<'a, T: CogBufferType> {
  dims: WorldDims,
  data: &'a mut [T::GpuType],
}
impl<'a, T: CogBufferType> CogBufferWriteMap<'a, T> {
  pub(crate) fn new(dims: WorldDims, data: &'a mut [T::GpuType])
    -> CogBufferWriteMap<'a, T>
  {
    CogBufferWriteMap { dims, data }
  }

  pub(crate) fn dims(&self) -> WorldDims {
    self.dims
  }

  pub(crate) fn set(&mut self, coord: CellCoord, value: T) {
    let index = self.dims.coord_index(coord) as usize;
    self.data[index] = value.clone().into();
  }
}
