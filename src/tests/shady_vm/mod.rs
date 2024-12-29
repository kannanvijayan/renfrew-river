use crate::gpu::{
  bitcode,
  GpuBufferDataType,
  ShadyAssembler,
  ShadyProgram,
};

mod trivial;
mod collatz;

pub(crate) fn assemble_program<F>(f: F) -> ShadyProgram
  where F: FnOnce(&mut ShadyAssembler)
{
  let mut assembler = ShadyAssembler::new();
  f(&mut assembler);
  let prog = assembler.assemble_program().expect("Failed to assemble program");
  validate_program(&prog);
  prog
}

pub(crate) fn validate_program(program: &ShadyProgram) {
  for instr in program.iter_instructions() {
    let native = instr.to_native();
    let recreated = bitcode::Instruction::from_native(native);
    assert_eq!(*instr, recreated);
  }
}
