use std::{
  collections::HashMap,
  mem,
};
use crate::{
  gpu::{
    shady_vm::{
      ShadyProgram,
      ShadyProgramIndex,
      ShadyProgramGpuBuffer,
      bitcode as bc,
    },
    GpuBufferOptions,
    GpuDevice,
    GpuBufferDataType,
  },
  persist::{ ProgramStorePersist, ProgramPersist },
};

/**
 * Manager structure for a store of programs.
 * 
 * Programs can be remove and added and the underlying buffer will be
 * updated.
 */
pub(crate) struct GpuProgramStore {
  // The in-cpu program representations and information.
  programs: Vec<ShadyProgramInfo>,

  // Map of program names to program number.
  name_to_position: HashMap<String, ShadyProgramIndex>,

  // The gpu buffer of programs.
  buffer: ShadyProgramGpuBuffer,
}
impl GpuProgramStore {
  const INIT_BUFFER_INSTRS: usize = 64 * 1024;
  const PAD_PROGRAM: usize = 4;
  const ALIGN_BUFFER_INSTRS: usize = 16;

  pub(crate) fn new(device: &GpuDevice) -> GpuProgramStore {
    let programs = Vec::new();
    let name_to_position = HashMap::new();
    let buffer = ShadyProgramGpuBuffer::new(
      device,
      Self::INIT_BUFFER_INSTRS,
      GpuBufferOptions::empty()
        .with_label("GpuProgramStoreBuffer")
        .with_storage(true)
        .with_copy_src(true)
        .with_copy_dst(true)
    );

    GpuProgramStore { programs, name_to_position, buffer }
  }

  fn next_program_index(&self) -> ShadyProgramIndex {
    let index = self.programs.len();
    let index = index + Self::PAD_PROGRAM;
    let index = (index + Self::ALIGN_BUFFER_INSTRS - 1) / Self::ALIGN_BUFFER_INSTRS;
    debug_assert!(index < u32::MAX as usize);
    ShadyProgramIndex::from_u32(index as u32)
  }

  pub(crate) fn add_program(&mut self, name: String, program: ShadyProgram) -> ShadyProgramIndex {
    let index = self.next_program_index();
    self.programs.push(ShadyProgramInfo { name: name.clone(), index, program });
    self.name_to_position.insert(name, index);
    index
  }

  pub(crate) fn lookup_program_index(&self, name: &str) -> Option<ShadyProgramIndex> {
    self.name_to_position.get(name).copied()
  }

  pub(crate) async fn sync_gpu_buffer(&self, device: &GpuDevice) {
    type GpuNativeInsType = <bc::Instruction as GpuBufferDataType>::NativeType;
    // TODO: resize buffer if too small.
    for info in self.programs.iter() {
      let index = info.index.to_u32() as usize;
      let offset = index * mem::size_of::<GpuNativeInsType>();
      info.program.write_to_buffer(device, offset, &self.buffer).await;
    }
  }

  pub(crate) fn buffer(&self) -> &ShadyProgramGpuBuffer {
    &self.buffer
  }

  pub(crate) fn to_persist(&self) -> ProgramStorePersist {
    let programs = self.programs.iter().map(|info| {
      let name = info.name.clone();
      let index = info.index;
      let instrs = info.program.bitcode.clone();
      ProgramPersist::new(name, index, instrs)
    }).collect();
    ProgramStorePersist::new(programs)
  }
}

struct ShadyProgramInfo {
  name: String,
  index: ShadyProgramIndex,
  program: ShadyProgram,
}
