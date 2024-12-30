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
  let program = assemble_program(|asm| {
    asm.declare_label("loop_start");
    asm.declare_label("loop_end");
    asm.declare_label("collatz_step");

    // main: SET reg0 = (VM_ID % 5) + 1
    /* 0 */ asm.emit_mod(asm.dreg(0), asm.sreg_vmid(), asm.immv(5));
    /* 1 */ asm.emit_add(asm.dreg(0), asm.sreg(0), asm.immv(500));
    /* 2 */ asm.emit_load(asm.dreg(2), 0);

    asm.bind_label("loop_start");
    /* 3 */ asm.emit_sub(asm.dreg(99), asm.sreg(0), asm.immv(1));
    /* 4 */ asm.with_ifz().emit_jump("loop_end");
    // main: CALL collatz_step()
    /* 5 */ asm.emit_call("collatz_step");
    /* 6 */ asm.emit_add(asm.dreg(2), asm.sreg(2), asm.immv(1));
    /* 7 */ asm.emit_jump("loop_start");
    asm.bind_label("loop_end");
    // main: END
    /* 8 */ asm.emit_mov(asm.dreg(0), asm.sreg(2));
    /* 9 */ asm.emit_terminate();

    // FUNC collatz_step() {
    asm.bind_label("collatz_step");
    asm.declare_label("collatz_step_even");
    asm.declare_label("collatz_ret");
    // collatz_step: IF reg0 % 2 == 1
    /* 10 */ asm.emit_mod(asm.dreg(1), asm.sreg(0), asm.immv(2));
    /* 11 */ asm.with_ifz().emit_jump("collatz_step_even");
    // collatz_step: THEN reg0 = reg0 * 3 + 1
    /* 12 */ asm.emit_mul(asm.dreg(1), asm.sreg(0), asm.immv(3));
    /* 13 */ asm.emit_add(asm.dreg(1), asm.sreg(1), asm.immv(1));
    /* 14 */ asm.emit_jump("collatz_ret");
    // collatz_step: ELSE reg0 = reg0 / 2
    asm.bind_label("collatz_step_even");
    /* 15 */ asm.emit_div(asm.dreg(1), asm.sreg(0), asm.immv(2));
    // collatz_step: END
    asm.bind_label("collatz_ret");
    /* 16 */ asm.emit_mov(asm.dreg(0), asm.sreg(1));
    /* 17 */ asm.emit_ret();
    // }
  });

  program.test_dump();

  block_on(async {
    let device = GpuDevice::new().await;
    let num_vms = 128 * 1024;

    let register_file_buffer =
      GpuSeqBuffer::<ShadyRegisterFile>::new(
        &device,
        num_vms as usize,
        GpuBufferOptions::empty()
          .with_storage(true)
          .with_copy_dst(true)
          .with_copy_src(true)
      );

    // parse an integer from the env variable "SHADY_VM_COLLATZ_ITERATIONS"
    let ins_count = std::env::var("SHADY_VM_COLLATZ_ITERATIONS")
      .ok()
      .and_then(|s| s.parse::<u32>().ok())
      .expect("SHADY_VM_COLLATZ_ITERATIONS must be set to a positive integer");
    run_program(&device, program, &register_file_buffer, Some(ins_count)).await;

    let copy_regfiles = register_file_buffer.read_mappable_full_copy(&device).await;
    let regfiles = copy_regfiles.to_vec().await;
    for (i, regfile) in regfiles.iter().enumerate() {
      assert_eq!((i, regfile.read_reg(241)), (i, count_collatz_steps(500 + i as u32)));
    }
  });
}


fn count_collatz_steps(n: u32) -> i32 {
  let mut steps = 0;
  let mut n = n;
  while n != 1 {
    n = if n % 2 == 0 { n / 2 } else { 3 * n + 1 };
    steps += 1;
  }
  steps
}
