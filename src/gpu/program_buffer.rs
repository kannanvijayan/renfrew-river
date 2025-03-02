use std::{
  collections::HashMap,
  mem,
};
use crate::{
  cog::CogDevice,
  shady_vm::{ ShadyProgram, ShadyProgramGpuBuffer, ShadyProgramIndex },
};

/**
 * Mutable structure for a store of programs.
 * 
 * Programs can be remove and added and the underlying buffer will be
 * updated.
 */
pub(crate) struct ProgramBuffer {
  // The in-cpu program representations and information.
  programs: Vec<ShadyProgramInfo>,

  // Map of program names to program number.
  name_to_position: HashMap<String, ShadyProgramIndex>,

  // The gpu buffer of programs.
  buffer: ShadyProgramGpuBuffer,
}
impl ProgramBuffer {
  const INIT_BUFFER_INSTRS: usize = 64 * 1024;
  const PAD_PROGRAM: usize = 4;
  const ALIGN_BUFFER_INSTRS: usize = 16;

  pub(crate) fn new(device: &CogDevice) -> ProgramBuffer {
    let programs = Vec::new();
    let name_to_position = HashMap::new();
    let buffer = ShadyProgramGpuBuffer::new_uninit(
      device,
      Self::INIT_BUFFER_INSTRS,
      "program_buffer"
    );

    ProgramBuffer { programs, name_to_position, buffer }
  }

  fn next_program_index(&self) -> ShadyProgramIndex {
    let index = self.programs.len();
    let index = index + Self::PAD_PROGRAM;
    let index = (index + Self::ALIGN_BUFFER_INSTRS - 1) / Self::ALIGN_BUFFER_INSTRS;
    debug_assert!(index < u32::MAX as usize);
    ShadyProgramIndex::from_u32(index as u32)
  }

  pub(crate) fn add_program<Nm>(&mut self, name: Nm, program: ShadyProgram)
    -> ShadyProgramIndex
    where Nm: Into<String>
  {
    let index = self.next_program_index();
    let name = name.into();
    self.programs.push(ShadyProgramInfo { name: name.clone(), index, program });
    self.name_to_position.insert(name, index);
    index
  }

  pub(crate) fn lookup_program_index(&self, name: &str) -> Option<ShadyProgramIndex> {
    self.name_to_position.get(name).copied()
  }

  pub(crate) fn sync_gpu_buffer(&self) {
    // TODO: resize buffer if too small.
    for info in self.programs.iter() {
      let index = info.index.to_u32() as usize;
      info.program.write_to_buffer(index, &self.buffer)
    }
  }

  pub(crate) fn buffer(&self) -> &ShadyProgramGpuBuffer {
    &self.buffer
  }
}

struct ShadyProgramInfo {
  name: String,
  index: ShadyProgramIndex,
  program: ShadyProgram,
}
