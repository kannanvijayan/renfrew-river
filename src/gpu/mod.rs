
/**
 * Terrain and initial world generation.
 */

mod constants;
mod device;
mod buffer_data_type;
mod buffer_options;
mod map_buffer;
mod seq_buffer;
mod world;

mod shady_vm;

pub(crate) mod compute;

pub(crate) use self::{
  constants::{ GPU_MIN_BUFFER_SIZE, GPU_COPY_BUFFER_ALIGNMENT },
  device::GpuDevice,
  buffer_data_type::{ GpuBufferNativeType, GpuBufferDataType },
  buffer_options::GpuBufferOptions,
  map_buffer::GpuMapBuffer,
  seq_buffer::GpuSeqBuffer,
  world::{ GpuWorld, GpuWorldParams },
  shady_vm::{
    ShadyAssembler,
    ShadyProgram,
    ShadyProgramGpuBuffer,
    ShadyProgramIndex,
    ShadyRegisterFile,
    bytecode,
    bitcode
  },
};
