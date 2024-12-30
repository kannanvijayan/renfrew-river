use crate::gpu::{
  bitcode,
  GpuBufferDataType,
  GpuBufferOptions,
  GpuDevice,
  GpuSeqBuffer,
  ShadyAssembler,
  ShadyProgram,
  ShadyProgramGpuBuffer,
  ShadyRegisterFile,
  compute::{ shady_interpret, ShadyInterpVmInfo },
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


pub(crate) async fn run_program(
  device: &GpuDevice,
  program: ShadyProgram,
  register_file_buffer: &GpuSeqBuffer<ShadyRegisterFile>,
  ins_count: Option<u32>,
) {
  let num_vms = register_file_buffer.length();

  let program_buffer = ShadyProgramGpuBuffer::new(
    &device,
    1024,
    GpuBufferOptions::empty()
      .with_storage(true)
      .with_copy_dst(true)
  );

  program_buffer.write_iter_staged(
    &device,
    0,
    program.iter_instructions()
  ).await;

  let vms_info = vec![ShadyInterpVmInfo {
    program_start_pc: 0,
  }; num_vms];

  shady_interpret(
    &device,
    &program_buffer,
    vms_info,
    &register_file_buffer,
    ins_count,
  ).await;
}
