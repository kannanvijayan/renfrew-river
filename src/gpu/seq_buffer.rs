use std::marker::PhantomData;
use futures;

use crate::gpu::{
  GpuBufferDataType,
  GpuBufferNativeType,
  GpuBufferOptions,
  GpuDevice,
};


pub(crate) struct GpuSeqBuffer<T: GpuBufferDataType> {
  length: usize,
  buffer: wgpu::Buffer,
  _phantom: PhantomData<T>,
}

impl<T: GpuBufferDataType> GpuSeqBuffer<T> {
  pub(crate) fn new(
    device: &GpuDevice,
    length: usize,
    opts: GpuBufferOptions,
  ) -> GpuSeqBuffer<T> {
    let size = (length as u64) * (T::NativeType::SIZE as u64);
    let buffer = opts.create_wgpu_buffer(device, size);
    GpuSeqBuffer {
      length,
      buffer,
      _phantom: PhantomData,
    }
  }

  pub(crate) fn length(&self) -> usize {
    self.length
  }

  pub(crate) fn wgpu_buffer(&self) -> &wgpu::Buffer {
    &self.buffer
  }

  /**
   * Cast this buffer to a buffer over the underlying native type.
   */
  pub(crate) fn cast_as_native_type(&self) -> &GpuSeqBuffer<T::NativeType> {
    // This is always valid, because the buffer is always constructed
    // using the native type.
    unsafe { &*(self as *const GpuSeqBuffer<T> as *const GpuSeqBuffer<T::NativeType>) }
  }

  /**
   * Get a cpu-memory mappable copy of this buffer.
   */
  pub(crate) async fn read_mappable_full_copy(&self, device: &GpuDevice)
    -> GpuSeqBuffer<T>
  {
    let target_buffer = GpuSeqBuffer::<T>::new(
      device,
      self.length,
      GpuBufferOptions::empty()
        .with_label("ReadMappableFullCopyTargetBuffer")
        .with_copy_dst(true)
        .with_map_read(true)
    );

    // Encode the commands.
    let mut encoder = device.device().create_command_encoder(
      &wgpu::CommandEncoderDescriptor {
        label: Some("ReadMappableFullCopyEncoder"),
      }
    );

    let native_size = T::NativeType::SIZE as u64;

    encoder.copy_buffer_to_buffer(
      self.wgpu_buffer(),
      0,
      &target_buffer.wgpu_buffer(),
      0,
      self.length as u64 * native_size,
    );

    // Submit the commands.
    let submission_index = device.queue().submit(Some(encoder.finish()));

    // Wait for the commands to finish.
    device.device().poll(wgpu::Maintain::WaitForSubmissionIndex(submission_index));

    target_buffer
  }

  /**
   * Copy a slice of this Seq into a new, mappable seq buffer.
   */
  pub(crate) async fn read_mappable_subseq_copy(&self,
    device: &GpuDevice,
    offset: usize,
    length: usize,
  ) -> GpuSeqBuffer<T> {
    let target_buffer = GpuSeqBuffer::<T>::new(
      device,
      length,
      GpuBufferOptions::empty()
        .with_label("ReadMappableSubseqCopyTargetBuffer")
        .with_copy_dst(true)
        .with_map_read(true)
    );

    debug_assert!(offset < self.length, "Offset too large");
    debug_assert!(offset + length <= self.length, "Length too large");

    // Encode the commands.
    let mut encoder = device.device().create_command_encoder(
      &wgpu::CommandEncoderDescriptor {
        label: Some("ReadMappalbeSubseqCopyEncoder"),
      }
    );

    let native_size = T::NativeType::SIZE as u64;
    let offset_u64 = offset as u64;
    let length_u64 = length as u64;

    encoder.copy_buffer_to_buffer(
      self.wgpu_buffer(),
      offset_u64 * native_size,
      &target_buffer.wgpu_buffer(),
      0,
      length_u64 * native_size,
    );

    // Submit the commands.
    let submission_index = device.queue().submit(Some(encoder.finish()));

    // Wait for the commands to finish.
    device.device().poll(wgpu::Maintain::WaitForSubmissionIndex(submission_index));

    target_buffer
  }

  pub(crate) async fn to_vec(&self) -> Vec<T> {
    let (mapped_send, mapped_recv) =
      futures::channel::oneshot::channel::<bool>();
    let slice = self.buffer.slice(..);
    slice.map_async(wgpu::MapMode::Read, |result| {
      if result.is_ok() {
        mapped_send.send(true).unwrap();
      } else {
        panic!("Failed to map buffer for reading.");
      }
    });
    mapped_recv.await.unwrap();
    let view = slice.get_mapped_range();
    bytemuck::cast_slice::<u8, T::NativeType>(&view)
      .iter()
      .copied()
      .map(T::from_native)
      .collect()
  }
}
