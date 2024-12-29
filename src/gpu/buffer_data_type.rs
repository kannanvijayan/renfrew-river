use std::fmt;
use bytemuck::Pod;

/**
 * A trait for types that can be stored in GPU buffers.
 *
 * Shader code will need to know how to interpret the data
 * in the buffer.
 */
pub(crate) trait GpuBufferNativeType: Sized + Pod + Copy + Clone + fmt::Debug {
  // The size of the type in the gpu.
  const SIZE: usize;

  // Write a value of this type to a slice.
  fn write_to_slice(&self, slice: &mut [u8]);

  // Read a value of this type from a slice.
  fn read_from_slice(slice: &[u8]) -> Self;
}

impl GpuBufferNativeType for u8 {
  const SIZE: usize = 1;
  fn write_to_slice(&self, slice: &mut [u8]) {
    slice[0] = *self;
  }
  fn read_from_slice(slice: &[u8]) -> Self {
    slice[0]
  }
}

impl GpuBufferNativeType for i8 {
  const SIZE: usize = 1;
  fn write_to_slice(&self, slice: &mut [u8]) {
    slice[0] = *self as u8;
  }
  fn read_from_slice(slice: &[u8]) -> Self {
    slice[0] as i8
  }
}

impl GpuBufferNativeType for u16 {
  const SIZE: usize = 2;
  fn write_to_slice(&self, slice: &mut [u8]) {
    let bytes = self.to_le_bytes();
    for i in 0..2 {
      slice[i] = bytes[i];
    }
  }
  fn read_from_slice(slice: &[u8]) -> Self {
    let mut bytes = [0u8; 2];
    for i in 0..2 {
      bytes[i] = slice[i];
    }
    u16::from_le_bytes(bytes)
  }
}

impl GpuBufferNativeType for i16 {
  const SIZE: usize = 2;
  fn write_to_slice(&self, slice: &mut [u8]) {
    let bytes = self.to_le_bytes();
    for i in 0..2 {
      slice[i] = bytes[i];
    }
  }
  fn read_from_slice(slice: &[u8]) -> Self {
    let mut bytes = [0u8; 2];
    for i in 0..2 {
      bytes[i] = slice[i];
    }
    i16::from_le_bytes(bytes)
  }
}

impl GpuBufferNativeType for u32 {
  const SIZE: usize = 4;
  fn write_to_slice(&self, slice: &mut [u8]) {
    let bytes = self.to_le_bytes();
    for i in 0..4 {
      slice[i] = bytes[i];
    }
  }
  fn read_from_slice(slice: &[u8]) -> Self {
    let mut bytes = [0u8; 4];
    for i in 0..4 {
      bytes[i] = slice[i];
    }
    u32::from_le_bytes(bytes)
  }
}

impl GpuBufferNativeType for i32 {
  const SIZE: usize = 4;
  fn write_to_slice(&self, slice: &mut [u8]) {
    let bytes = self.to_le_bytes();
    for i in 0..4 {
      slice[i] = bytes[i];
    }
  }
  fn read_from_slice(slice: &[u8]) -> Self {
    let mut bytes = [0u8; 4];
    for i in 0..4 {
      bytes[i] = slice[i];
    }
    i32::from_le_bytes(bytes)
  }
}

impl GpuBufferNativeType for f32 {
  const SIZE: usize = 4;
  fn write_to_slice(&self, slice: &mut [u8]) {
    let bytes = self.to_le_bytes();
    for i in 0..4 {
      slice[i] = bytes[i];
    }
  }
  fn read_from_slice(slice: &[u8]) -> Self {
    let mut bytes = [0u8; 4];
    for i in 0..4 {
      bytes[i] = slice[i];
    }
    f32::from_le_bytes(bytes)
  }
}

impl GpuBufferNativeType for [u32; 2] {
  const SIZE: usize = 8;
  fn write_to_slice(&self, slice: &mut [u8]) {
    self[0].write_to_slice(&mut slice[0..4]);
    self[1].write_to_slice(&mut slice[4..8]);
  }
  fn read_from_slice(slice: &[u8]) -> Self {
    let x = u32::read_from_slice(&slice[0..4]);
    let y = u32::read_from_slice(&slice[4..8]);
    [x, y]
  }
}

impl GpuBufferNativeType for [i32; 256] {
  const SIZE: usize = 4 * 256;
  fn write_to_slice(&self, slice: &mut [u8]) {
    for i in 0..256 {
      self[i].write_to_slice(&mut slice[i*4..(i+1)*4]);
    }
  }
  fn read_from_slice(slice: &[u8]) -> Self {
    let mut regs = [0; 256];
    for i in 0..256 {
      regs[i] = i32::read_from_slice(&slice[i*4..(i+1)*4]);
    }
    regs
  }
}

/**
 * Types that map to a GpuBufferNativeType.
 *
 * This is not necessarily a type that can be operated on
 * directly by the GPU, just one that knows how to convert
 * itself into one.
 */
pub(crate) trait GpuBufferDataType: Sized + Clone + fmt::Debug {
  // The gpu-native type this converts to.  The target native type must itself
  // implement GpuBufferDataType with itself as the native type.
  type NativeType: GpuBufferNativeType + GpuBufferDataType<NativeType=Self::NativeType>;

  // Convert this type to the gpu-native type.
  fn to_native(&self) -> Self::NativeType;

  // Convert the gpu-native type to this type.
  fn from_native(data_type: Self::NativeType) -> Self;
}

impl GpuBufferDataType for u8 {
  type NativeType = u8;
  fn to_native(&self) -> Self::NativeType { *self }
  fn from_native(data_type: Self::NativeType) -> Self { data_type }
}

impl GpuBufferDataType for i8 {
  type NativeType = i8;
  fn to_native(&self) -> Self::NativeType { *self }
  fn from_native(data_type: Self::NativeType) -> Self { data_type }
}

impl GpuBufferDataType for u16 {
  type NativeType = u16;
  fn to_native(&self) -> Self::NativeType { *self }
  fn from_native(data_type: Self::NativeType) -> Self { data_type }
}

impl GpuBufferDataType for i16 {
  type NativeType = i16;
  fn to_native(&self) -> Self::NativeType { *self }
  fn from_native(data_type: Self::NativeType) -> Self { data_type }
}

impl GpuBufferDataType for u32 {
  type NativeType = u32;
  fn to_native(&self) -> Self::NativeType { *self }
  fn from_native(data_type: Self::NativeType) -> Self { data_type }
}

impl GpuBufferDataType for i32 {
  type NativeType = i32;
  fn to_native(&self) -> Self::NativeType { *self }
  fn from_native(data_type: Self::NativeType) -> Self { data_type }
}

impl GpuBufferDataType for f32 {
  type NativeType = f32;
  fn to_native(&self) -> Self::NativeType { *self }
  fn from_native(data_type: Self::NativeType) -> Self { data_type }
}

impl GpuBufferDataType for [u32; 2] {
  type NativeType = [u32; 2];
  fn to_native(&self) -> Self::NativeType { *self }
  fn from_native(data_type: Self::NativeType) -> Self { data_type }
}

impl GpuBufferDataType for [i32; 256] {
  type NativeType = [i32; 256];
  fn to_native(&self) -> Self::NativeType { *self }
  fn from_native(data_type: Self::NativeType) -> Self { data_type }
}
