use std::marker::PhantomData;
use crate::{
  gpu::{
    GpuBufferDataType,
    GpuBufferNativeType,
    GpuBufferOptions,
    GpuDevice,
    GpuSeqBuffer,
  },
  world::{ WorldDims, CellCoord, VecMap },
};

pub(crate) struct GpuMapBuffer<T: GpuBufferDataType> {
  dims: WorldDims,
  buffer: wgpu::Buffer,
  _phantom: PhantomData<T>,
}

impl<T: GpuBufferDataType> GpuMapBuffer<T> {
  pub(crate) fn new(
    device: &GpuDevice,
    world_dims: WorldDims,
    opts: GpuBufferOptions,
  ) -> GpuMapBuffer<T> {
    let size = (world_dims.area() as u64) * (T::NativeType::SIZE as u64);
    let buffer = opts.create_wgpu_buffer(device, size);
    GpuMapBuffer {
      dims: world_dims,
      buffer,
      _phantom: PhantomData,
    }
  }

  pub(crate) fn from_dims_and_buffer(
    dims: WorldDims,
    buffer: wgpu::Buffer,
  ) -> GpuMapBuffer<T> {
    GpuMapBuffer {
      dims,
      buffer,
      _phantom: PhantomData,
    }
  }

  pub(crate) fn wgpu_buffer(&self) -> &wgpu::Buffer {
    &self.buffer
  }

  pub(crate) fn dims(&self) -> WorldDims {
    self.dims
  }

  /**
   * Cast this buffer to a buffer over the underlying native type.
   */
  pub(crate) fn cast_as_native_type(&self) -> &GpuMapBuffer<T::NativeType> {
    // This is always valid, because the buffer is always constructed
    // using the native type.
    unsafe { &*(self as *const GpuMapBuffer<T> as *const GpuMapBuffer<T::NativeType>) }
  }

  /**
   * Get a cpu-memory mappable copy of this buffer.
   */
  pub(crate) async fn read_mappable_full_copy(&self, device: &GpuDevice)
    -> GpuMapBuffer<T>
  {
    let target_buffer = GpuMapBuffer::<T>::new(
      device,
      self.dims,
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
      self.dims.area() as u64 * native_size,
    );

    // Submit the commands.
    let submission_index = device.queue().submit(Some(encoder.finish()));

    // Wait for the commands to finish.
    device.device().poll(wgpu::Maintain::WaitForSubmissionIndex(submission_index));

    target_buffer
  }

  /**
   * Copy a 2D slice of this Map into a new Map.
   */
  pub(crate) async fn read_mappable_area_copy(&self,
    device: &GpuDevice,
    top_left: CellCoord,
    area: WorldDims,
  ) -> GpuMapBuffer<T> {
    let world_columns = self.dims.columns_u64();
    let area_columns = area.columns_u64();
    let area_rows = area.rows_u64();
    let top_left_col = top_left.col_u64();
    let top_left_row = top_left.row_u64();
    let target_buffer = GpuMapBuffer::<T>::new(
      device,
      area,
      GpuBufferOptions::empty()
        .with_label("ReadMappableAreaCopyTargetBuffer")
        .with_copy_dst(true)
        .with_map_read(true)
    );

    debug_assert!(
      self.dims().contains_coord(top_left),
      "Source buffer does not contain top_left"
    );
    debug_assert!(
      self.dims().contains_coord(area.bottom_right_inclusive(top_left)),
      "Source buffer does not contain bottom_right"
    );

    // Encode the commands.
    let mut encoder = device.device().create_command_encoder(
      &wgpu::CommandEncoderDescriptor {
        label: Some("ReadMappableAreaCopyEncoder"),
      }
    );

    let native_size = T::NativeType::SIZE as u64;

    for row in 0 .. area_rows {
      let src_row = top_left_row + row;
      let src_offset = (src_row * world_columns) + top_left_col;
      let dst_offset = row * area_columns;
      encoder.copy_buffer_to_buffer(
        self.wgpu_buffer(),
        src_offset * native_size,
        &target_buffer.wgpu_buffer(),
        dst_offset * native_size,
        area_columns * native_size,
      );
    }

    // Submit the commands.
    let submission_index = device.queue().submit(Some(encoder.finish()));

    // Wait for the commands to finish.
    device.device().poll(wgpu::Maintain::WaitForSubmissionIndex(submission_index));

    target_buffer
  }

  /**
   * Read this entire buffer into a VecMap (cpu-memory structure).
   * The buffer must be MAP_READ.
   */
  pub(crate) async fn to_vec_map(&self) -> VecMap<T> {
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
    let vec = bytemuck::cast_slice::<u8, T::NativeType>(&view)
      .iter()
      .copied()
      .map(T::from_native)
      .collect();

    VecMap::from_vec(self.dims, vec)
  }
}
