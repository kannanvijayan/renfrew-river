use futures::executor::block_on;

use crate::gpu::{
  bitcode,
  bytecode,
  compute::{ ShadyInterpVmInfo, shady_interpret },
  GpuBufferOptions,
  GpuDevice,
  GpuSeqBuffer,
  ShadyProgram,
  ShadyRegisterFile
};
use super::{ assemble_program, run_program };


#[test]
fn collatz_vmid() {
  assemble_program(|asm| {
    asm.declare_label("collatz_step");

    // main: SET reg0 = (VM_ID % 5) + 1
    asm.emit_mod(asm.dreg(0), asm.sreg_vmid(), asm.immv(5));
    asm.emit_add(asm.dreg(0), asm.sreg(0), asm.immv(1));
    // main: CALL collatz_step()
    asm.emit_call("collatz_step");
    // main: END
    asm.emit_terminate();

    // FUNC collatz_step() {
    asm.bind_label("collatz_step");
    asm.declare_label("collatz_step_even");
    asm.declare_label("collatz_ret");
    // collatz_step: IF reg0 % 2 == 1
    asm.emit_mod(asm.dreg(1), asm.sreg(0), asm.immv(2));
    asm.with_ifz().emit_jump("collatz_step_even");
    // collatz_step: THEN reg0 = reg0 * 3 + 1
    asm.emit_mul(asm.dreg(1), asm.sreg(0), asm.immv(3));
    asm.emit_add(asm.dreg(1), asm.sreg(1), asm.immv(1));
    asm.emit_jump("collatz_ret");
    // collatz_step: ELSE reg0 = reg0 / 2
    asm.bind_label("collatz_step_even");
    asm.emit_div(asm.dreg(1), asm.sreg(0), asm.immv(2));
    // collatz_step: END
    asm.bind_label("collatz_ret");
    asm.emit_ret();
    // }
  });

  /*
  block_on(async {
    let device = GpuDevice::new().await;
    let num_vms = 64 * 1024;

    let register_file_buffer =
      GpuSeqBuffer::<ShadyRegisterFile>::new(
        &device,
        num_vms as usize,
        GpuBufferOptions::empty()
          .with_storage(true)
          .with_copy_dst(true)
          .with_copy_src(true)
      );

    run_program(program, &register_file_buffer).await;

    let copy_regfiles = register_file_buffer.read_mappable_full_copy(&device).await;
    let regfiles = copy_regfiles.to_vec().await;
    for regfile in regfiles.iter() {
      assert_eq!(regfile.read_reg(0), i32::MAX);
    }
  });
  */
}
