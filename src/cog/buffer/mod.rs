
mod base;
mod map;
mod seq;
mod uniform;

pub(crate) use self::{
  base::CogBufferBase,
  map::{ CogMapBuffer, CogBufferReadMap, CogBufferWriteMap },
  seq::CogSeqBuffer,
  uniform::{ CogUniformBuffer, CogUniformType },
};

use bytemuck::Pod;

/**
 * A rust type that can be used as an element type for CogBuffers.
 */
pub(crate) trait CogBufferType
  : Clone + Into<Self::GpuType> + From<Self::GpuType>
{
  type GpuType: Pod;
}

impl CogBufferType for u8 {
  type GpuType = u8;
}
impl CogBufferType for i8 {
  type GpuType = i8;
}
impl CogBufferType for u16 {
  type GpuType = u16;
}
impl CogBufferType for i16 {
  type GpuType = i16;
}
impl CogBufferType for u32 {
  type GpuType = u32;
}
impl CogBufferType for i32 {
  type GpuType = i32;
}
impl CogBufferType for f32 {
  type GpuType = f32;
}
