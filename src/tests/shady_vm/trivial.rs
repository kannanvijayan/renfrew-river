use futures::executor::block_on;

use crate::gpu::{
  GpuBufferOptions,
  GpuDevice,
  GpuSeqBuffer,
  ShadyRegisterFile,
};
use super::{ assemble_program, run_program };

fn make_register_file_buffer(device: &GpuDevice, num_vms: u32) -> GpuSeqBuffer<ShadyRegisterFile> {
  GpuSeqBuffer::<ShadyRegisterFile>::new(
    &device,
    num_vms as usize,
    GpuBufferOptions::empty()
      .with_storage(true)
      .with_copy_src(true)
      .with_copy_dst(true)
  )
}

#[test]
fn const_load() {
  let program = assemble_program(|asm| {
    asm.emit_load(asm.dreg(0), i32::MAX);
  });
  block_on(async {
    let device = GpuDevice::new().await;
    let num_vms = 64 * 1024;

    let register_file_buffer = make_register_file_buffer(&device, num_vms);

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

    let register_file_buffer = make_register_file_buffer(&device, num_vms);

    run_program(&device, program, &register_file_buffer, Some(1)).await;

    let copy_regfiles = register_file_buffer.read_mappable_full_copy(&device).await;
    let regfiles = copy_regfiles.to_vec().await;
    for (i, regfile) in regfiles.iter().enumerate() {
      assert_eq!(regfile.read_reg(0), i as i32 % 3);
    }
  });
}


#[test]
fn indirect_src1() {
  const ADJUST: i16 = 101;
  let program = assemble_program(|asm| {
    // Store a reference to register 33 in register 0.
    asm.emit_mov(asm.dreg(1), asm.immv(33));

    // Store the vmid in register 33.
    asm.emit_mov(asm.dreg(33), asm.sreg_vmid());
    asm.emit_add(asm.dreg(33), asm.sreg(33), asm.immv(ADJUST));

    // Load the value from register 33 indirectly into register 1.
    {
      let d = asm.dreg(2);
      let s = asm.sreg(1);
      let i = asm.immv(0);
      asm.with_indsrc1().emit_add(d, s, i);
    }
  });
  program.test_dump();
  block_on(async {
    let device = GpuDevice::new().await;
    let num_vms = 64 * 1024;

    let register_file_buffer = make_register_file_buffer(&device, num_vms);

    run_program(&device, program, &register_file_buffer, Some(4)).await;

    let copy_regfiles = register_file_buffer.read_mappable_full_copy(&device).await;
    let regfiles = copy_regfiles.to_vec().await;
    for (i, regfile) in regfiles.iter().enumerate() {
      assert_eq!(regfile.read_reg(2), ADJUST as i32 + i as i32);
    }
  });
}



#[test]
fn indirect_src2() {
  const ADJUST: i16 = 101;
  let program = assemble_program(|asm| {
    // Store a reference to register 33 in register 0.
    asm.emit_mov(asm.dreg(1), asm.immv(33));

    // Store the vmid in register 33.
    asm.emit_mov(asm.dreg(33), asm.sreg_vmid());
    asm.emit_add(asm.dreg(33), asm.sreg(33), asm.immv(ADJUST));

    // Load the value from register 33 indirectly into register 1.
    {
      let d = asm.dreg(2);
      let i = asm.immv(0);
      let s = asm.sreg(1);
      asm.with_indsrc2().emit_add(d, i, s);
    }
  });
  program.test_dump();
  block_on(async {
    let device = GpuDevice::new().await;
    let num_vms = 64 * 1024;

    let register_file_buffer = make_register_file_buffer(&device, num_vms);

    run_program(&device, program, &register_file_buffer, Some(4)).await;

    let copy_regfiles = register_file_buffer.read_mappable_full_copy(&device).await;
    let regfiles = copy_regfiles.to_vec().await;
    for (i, regfile) in regfiles.iter().enumerate() {
      assert_eq!(regfile.read_reg(2), ADJUST as i32 + i as i32);
    }
  });
}


#[test]
fn indirect_dst() {
  const ADJUST: i16 = 101;
  let program = assemble_program(|asm| {
    // Store a reference to register 33 in register 0.
    asm.emit_mov(asm.dreg(1), asm.immv(2));

    // Load the value from register 33 indirectly into register 1.
    {
      let d = asm.dreg(1);
      let i = asm.immv(ADJUST);
      let s = asm.sreg_vmid();
      asm.with_inddst().emit_add(d, i, s);
    }
  });
  program.test_dump();
  block_on(async {
    let device = GpuDevice::new().await;
    let num_vms = 64 * 1024;

    let register_file_buffer = make_register_file_buffer(&device, num_vms);

    run_program(&device, program, &register_file_buffer, Some(2)).await;

    let copy_regfiles = register_file_buffer.read_mappable_full_copy(&device).await;
    let regfiles = copy_regfiles.to_vec().await;
    for (i, regfile) in regfiles.iter().enumerate() {
      assert_eq!(regfile.read_reg(2), ADJUST as i32 + i as i32);
    }
  });
}
