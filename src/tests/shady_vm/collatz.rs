use futures::executor::block_on;

use crate::gpu::{
  bitcode,
  compute::{ VmInterpretInfo, shady_interpret },
  GpuBufferOptions,
  GpuDevice,
  GpuSeqBuffer,
  ShadyProgram,
  ShadyRegisterFile
};
use super::assemble_program;


#[test]
fn test() {
  let program = make_collatz_program();
  block_on(async_test(program));
}

async fn async_test(program: ShadyProgram) {
  let device = GpuDevice::new().await;
  let num_vms = 64 * 1024;

  let program_buffer =
    GpuSeqBuffer::<bitcode::Instruction>::new(
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


  let register_file_buffer =
    GpuSeqBuffer::<ShadyRegisterFile>::new(
      &device,
      num_vms as usize,
      GpuBufferOptions::empty()
        .with_storage(true)
        .with_copy_dst(true)
        .with_copy_src(true)
    );
  
  let vms_info = vec![VmInterpretInfo {
    program_start_pc: 0,
  }; num_vms];

  shady_interpret(
    &device,
    &program_buffer,
    vms_info,
    &register_file_buffer,
  ).await;

  let copy_regfiles = register_file_buffer.read_mappable_full_copy(&device).await;
  let regfiles = copy_regfiles.to_vec().await;
  for (i, regfile) in regfiles.iter().enumerate() {
    eprintln!("VM {}: {:?}", i, regfile.read_reg(0));
  }
}

fn make_collatz_program() -> ShadyProgram {
  assemble_program(|asm| {
    // Take vm_id modulo 3, and save it to reg0.
    asm.emit_mod(asm.dreg(0), asm.sreg_vmid(), asm.immv(3));
  })
}
