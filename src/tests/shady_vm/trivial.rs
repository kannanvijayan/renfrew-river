use futures::executor::block_on;

use crate::gpu::{
  GpuBufferOptions,
  GpuDevice,
  GpuSeqBuffer,
  ShadyRegisterFile,
};
use super::{ assemble_program, run_program };


#[test]
fn const_load() {
  let program = assemble_program(|asm| {
    asm.emit_load(asm.dreg(0), i32::MAX);
  });
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

    run_program(&device, program, &register_file_buffer, Some(1)).await;

    let copy_regfiles = register_file_buffer.read_mappable_full_copy(&device).await;
    let regfiles = copy_regfiles.to_vec().await;
    for regfile in regfiles.iter() {
      assert_eq!(regfile.read_reg(0), i32::MAX);
    }
  });
}

#[test]
fn modulo_by_constant() {
  let program = assemble_program(|asm| {
    // Take vm_id modulo 3, and save it to reg0.
    asm.emit_mod(asm.dreg(0), asm.sreg_vmid(), asm.immv(3));
  });
  block_on(async {
    let device = GpuDevice::new().await;
    let num_vms = 64 * 1024;

    let register_file_buffer =
      GpuSeqBuffer::<ShadyRegisterFile>::new(
        &device,
        num_vms as usize,
        GpuBufferOptions::empty()
          .with_storage(true)
          .with_copy_src(true)
      );

    run_program(&device, program, &register_file_buffer, Some(1)).await;

    let copy_regfiles = register_file_buffer.read_mappable_full_copy(&device).await;
    let regfiles = copy_regfiles.to_vec().await;
    for (i, regfile) in regfiles.iter().enumerate() {
      assert_eq!(regfile.read_reg(0), i as i32 % 3);
    }
  });
}
