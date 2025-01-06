use serde;
use std::mem;
use crate::gpu::{
  GpuDevice,
  GpuSeqBuffer,
  GpuBufferDataType,
  shady_vm::bitcode,
};

/**
 * An assembled program.
 */
pub(crate) struct ShadyProgram {
  pub bitcode: Vec<bitcode::Instruction>,
}
impl ShadyProgram {
  pub(crate) async fn write_to_buffer(&self,
    device: &GpuDevice,
    offset: usize,
    buffer: &ShadyProgramGpuBuffer,
  ) {
    buffer.write_iter_staged(device, offset, self.bitcode.iter()).await;
  }

  pub(crate) fn num_instrs(&self) -> usize {
    self.bitcode.len()
  }

  pub(crate) fn encoded_len(&self) -> usize {
    self.bitcode.len() *
      mem::size_of::<<bitcode::Instruction as GpuBufferDataType>::NativeType>()
  }

  pub(crate) fn iter_instructions(&self)
    -> impl ExactSizeIterator<Item=&bitcode::Instruction>
  {
    self.bitcode.iter()
  }

  pub(crate) fn test_dump(&self) {
    eprintln!("ShadyProgram:");

    eprintln!("  BITCODE:");
    for (i, instr) in self.bitcode.iter().enumerate() {
      println!("        {}: {:?}", i, instr);
    }

    eprintln!();
    eprintln!("  BYTES:");
    for (i, instr) in self.bitcode.iter().enumerate() {
      let nat = instr.to_native();
      let instr: [u16; 4] = bytemuck::cast(nat);
      eprintln!("        {}: op={:04x} dst={:04x} s1={:04x} s2={:04x}",
        i, instr[0], instr[1], instr[2], instr[3]);
    }
  }
}

pub(crate) type ShadyProgramGpuBuffer = GpuSeqBuffer<bitcode::Instruction>;

/**
 * Wrapper type for the position of a program in a ShadyProgramGpuBuffer
 */
#[derive(Clone, Copy, Debug)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct ShadyProgramIndex {
  pub offset: u32,
}
impl ShadyProgramIndex {
  pub(crate) fn from_u32(offset: u32) -> ShadyProgramIndex {
    ShadyProgramIndex { offset }
  }

  pub(crate) fn to_u32(&self) -> u32 {
    self.offset
  }
}
impl GpuBufferDataType for ShadyProgramIndex {
  type NativeType = u32;

  fn from_native(data_type: Self::NativeType) -> Self {
    ShadyProgramIndex { offset: data_type }
  }
  fn to_native(&self) -> Self::NativeType {
    self.offset
  }
}
