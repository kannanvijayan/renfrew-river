mod shasm;
mod assembler;
mod register_file;
mod program;

pub(crate) mod bytecode;
pub(crate) mod bitcode;

pub(crate) use self::{
  register_file::{ ShadyRegisterFile, ShadyRegister, SHADY_REG_COUNT },
  assembler::ShadyAssembler,
  program::{ ShadyProgram, ShadyProgramGpuBuffer, ShadyProgramIndex },
  shasm::{
    shasm_instr_parser,
    shasm_program_parser,
    ShasmInstrParseResult,
    ShasmParseError,
    ShasmProgram,
    ShasmProgramValidation,
  },
};
