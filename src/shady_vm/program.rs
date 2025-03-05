use serde;
use std::mem;
use crate::{
  cog::{ CogBufferType, CogDevice, CogSeqBuffer },
  shady_vm::bitcode::{self, Instruction},
};

/**
 * An assembled program.
 */
#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct ShadyProgram {
  pub bitcode: Vec<bitcode::Instruction>,
}
impl ShadyProgram {
  pub(crate) fn new(bitcode: Vec<bitcode::Instruction>) -> ShadyProgram {
    ShadyProgram { bitcode }
  }

  pub(crate) fn num_instrs(&self) -> usize {
    self.bitcode.len()
  }

  pub(crate) fn encoded_len(&self) -> usize {
    self.bitcode.len() *
      mem::size_of::<<bitcode::Instruction as CogBufferType>::GpuType>()
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
      let nat: <Instruction as CogBufferType>::GpuType = (*instr).into();
      let instr: [u16; 4] = bytemuck::cast(nat);
      eprintln!("        {}: op={:04x} dst={:04x} s1={:04x} s2={:04x}",
        i, instr[0], instr[1], instr[2], instr[3]);
    }
  }
}

pub(crate) type ShadyProgramGpuBuffer = CogSeqBuffer<bitcode::Instruction>;

/**
 * Wrapper type for the position of a program in a ShadyProgramGpuBuffer
 */
#[derive(Clone, Copy, Debug)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct ShadyProgramIndex {
  offset: u32,
}
impl ShadyProgramIndex {
  pub(crate) const INVALID: ShadyProgramIndex =
    ShadyProgramIndex { offset: 0xffff_ffff };

  pub(crate) fn from_u32(offset: u32) -> ShadyProgramIndex {
    ShadyProgramIndex { offset }
  }

  pub(crate) fn to_u32(&self) -> u32 {
    self.offset
  }
}
impl CogBufferType for ShadyProgramIndex {
  type GpuType = u32;
}
impl Into<u32> for ShadyProgramIndex {
  fn into(self) -> u32 {
    self.offset
  }
}
impl From<u32> for ShadyProgramIndex {
  fn from(offset: u32) -> Self {
    ShadyProgramIndex { offset }
  }
}
