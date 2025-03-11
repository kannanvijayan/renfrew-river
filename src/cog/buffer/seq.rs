use std::{ marker::PhantomData, mem };
use futures;
use crate::cog::CogDevice;
use super::{ CogBufferType, CogBufferBase };

pub(crate) struct CogSeqBuffer<T: CogBufferType> {
  pub(crate) base: CogBufferBase,
  len: usize,
  _phantom: PhantomData<T>,
}
impl<T: CogBufferType> CogSeqBuffer<T> {
  const ELEM_SIZE: usize = mem::size_of::<T::GpuType>();

  pub(crate) fn new(base: CogBufferBase, len: usize) -> CogSeqBuffer<T> {
    CogSeqBuffer { base, len, _phantom: PhantomData }
  }

  pub(crate) fn new_uninit(
    device: &CogDevice,
    len: usize,
    label: &str,
  ) -> CogSeqBuffer<T> {
    use wgpu::BufferUsages as BU;
    let size = (len as u64) * (Self::ELEM_SIZE as u64);
    let usage = BU::COPY_SRC | BU::COPY_DST | BU::STORAGE;
    let base = CogBufferBase::new_sized_uninit(&device, size, usage, label);
    CogSeqBuffer { base, len, _phantom: PhantomData }
  }

  pub(crate) async fn new_from_slice(
    device: &CogDevice,
    data: &[T],
    label: &str,
  ) -> CogSeqBuffer<T> {
    let len = data.len();
    let buffer = CogSeqBuffer::new_uninit(device, len, label);
    buffer.write_mapped(0, len, |slice| {
      for (i, item) in data.iter().enumerate() {
        slice[i] = (item.clone()).into();
      }
    });
    buffer
  }

  pub(crate) fn len(&self) -> usize {
    self.len
  }

  pub(crate) fn wgpu_buffer(&self) -> &wgpu::Buffer {
    self.base.wgpu_buffer()
  }

  /**
   * Cast this buffer to a buffer over a different type.
   * The other type must have the same size as this type.
   */
  pub(crate) fn cast_as<U: CogBufferType>(&self) -> &CogSeqBuffer<U> {
    assert!(Self::ELEM_SIZE == mem::size_of::<U>());
    unsafe { &*(self as *const CogSeqBuffer<T> as *const CogSeqBuffer<U>) }
  }

  /**
   * Cast this buffer to a buffer over a different type that may be a
   * a different size.  This returns a new buffer since it needs a new
   * length.
   */
  pub(crate) fn cast_resized<U: CogBufferType>(&self) -> CogSeqBuffer<U> {
    let byte_len = self.len * mem::size_of::<T::GpuType>();
    let new_len = byte_len / mem::size_of::<U::GpuType>();
    CogSeqBuffer::<U>::new(self.base.clone(), new_len)
  }

  pub(crate) fn read_mapped_full<R, F>(&self, func: F) -> R
    where F: FnOnce(&[T::GpuType]) -> R
  {
    self.read_mapped(0, self.len, func)
  }

  pub(crate) fn read_mapped<R, F>(&self, index: usize, len: usize, func: F) -> R
    where F: FnOnce(&[T::GpuType]) -> R
  {
    assert!(index + len <= self.len);
    let new_buffer =
      BufferRead::<T>::new_uninit(self.base.device(), len, "ReadMappedBuffer");
    self.base.device().encode_and_run("ReadMappableCopyEncoder", |encoder| {
      encoder.copy_buffer_to_buffer::<T>(
        &self.base, index,
        &new_buffer.base, 0,
        len,
      );
    });
    new_buffer.with_slice(|data| func(data))
  }

  pub(crate) fn write_mapped<F>(&self, index: usize, len: usize, func: F)
    where F: FnOnce(&mut [T::GpuType])
  {
    assert!(index + len <= self.len); 
    let new_buffer =
      BufferWrite::<T>::new_uninit(self.base.device(), len, "WriteMappedBuffer");
    new_buffer.with_slice_mut(|data| func(data));
    self.base.device().encode_and_run("WriteMappedEncoder", |encoder| {
      encoder.copy_buffer_to_buffer::<T>(
        &new_buffer.base, 0,
        &self.base, index,
        len,
      );
    });
  }

  pub(crate) fn write_slice(&self, index: usize, data: &[T]) {
    eprintln!("KVKV CogSeqBuffer::write_slice() index={} data.len()={}", index, data.len());
    self.write_mapped(index, data.len(), |slice| {
      for (i, item) in data.iter().enumerate() {
        slice[i] = (item.clone()).into();
      }
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


struct BufferRead<T: CogBufferType> {
  base: CogBufferBase,
  len: usize,
  _phantom: PhantomData<T>,
}
impl<T: CogBufferType> BufferRead<T> {
  const ELEM_SIZE: usize = mem::size_of::<T::GpuType>();

  pub(crate) fn new_uninit(device: &CogDevice, len: usize, label: &str)
    -> BufferRead<T>
  {
    use wgpu::BufferUsages as BU;
    let size = (len as u64) * (Self::ELEM_SIZE as u64);
    let usage = BU::COPY_DST | BU::MAP_READ;
    let base = CogBufferBase::new_sized_uninit(device, size, usage, label);
    BufferRead { base, len, _phantom: PhantomData }
  }

  pub(crate) fn len(&self) -> usize {
    self.len
  }

  /**
   * Evaluate the given function with a reference to an iterator over all the
   * data in the buffer.
   */
  pub(crate) fn with_slice<R, F>(&self, func: F) -> R
    where F: FnOnce(&[T::GpuType]) -> R
  {
    use futures::{ channel, executor };
    let (mapped_send, mapped_recv) = channel::oneshot::channel::<bool>();
    executor::block_on(async {
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
      func(data)
    })
  }
}


struct BufferWrite<T: CogBufferType> {
  base: CogBufferBase,
  len: usize,
  _phantom: PhantomData<T>,
}
impl<T: CogBufferType> BufferWrite<T> {
  const ELEM_SIZE: usize = mem::size_of::<T::GpuType>();

  pub(crate) fn new_uninit(device: &CogDevice, len: usize, label: &str)
    -> BufferWrite<T>
  {
    eprintln!("KVKV BufferWrite::new_uninit() len={}", len);
    use wgpu::BufferUsages as BU;
    let size = (len as u64) * (Self::ELEM_SIZE as u64);
    let usage = BU::COPY_SRC | BU::MAP_WRITE;
    let base = CogBufferBase::new_sized_uninit_mapped(device, size, usage, label);
    BufferWrite { base, len, _phantom: PhantomData }
  }

  pub(crate) fn len(&self) -> usize {
    self.len
  }

  /**
   * Evaluate the given function with a reference to an iterator over all the
   * data in the buffer.
   */
  pub(crate) fn with_slice_mut<F>(&self, func: F)
    where F: FnOnce(&mut [T::GpuType])
  {
    {
      let slice = self.base.wgpu_buffer().slice(..);
      let mut view = slice.get_mapped_range_mut();
      eprintln!("KVKV with_slice_mut() view_ptr={:p}", view.as_ptr());
      let view_ref: &mut [T::GpuType] = bytemuck::cast_slice_mut(&mut view);
      func(view_ref);
    }
    self.base.wgpu_buffer().unmap();
  }
}
