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
    buffer: &mut GpuSeqBuffer<bitcode::Instruction>
  ) {
    buffer.write_iter_staged(device, offset, self.bitcode.iter()).await;
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
