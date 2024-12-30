use crate::gpu::shady_vm::{
  ShadyProgram,
  bytecode::*,
  register_file,
};

/**
 * Generate bytecode for a shader program.
 */
pub(crate) struct ShadyAssembler {
  buffer: Vec<Ins>,
  labels: Vec<Label>,
  set_flags_for_next: bool,
  cond_for_next: Cond,
}
impl ShadyAssembler {
  pub(crate) fn new() -> Self {
    Self {
      buffer: Vec::new(),
      labels: Vec::new(),
      set_flags_for_next: true,
      cond_for_next: Cond::Always,
    }
  }

  pub(crate) fn dreg(&self, reg: u8) -> Dst {
    Dst::new(Reg::new(reg), Bump::new(0))
  }
  pub(crate) fn dreg_bm(&self, reg: u8, bump: i8) -> Dst {
    Dst::new(Reg::new(reg), Bump::new(bump))
  }
  pub(crate) fn sreg(&self, reg: u8) -> Src {
    Src::Reg(Reg::new(reg), Shift::new(0))
  }
  pub(crate) fn sreg_pc(&self) -> Src {
    Src::Reg(Reg::new_special(register_file::SHADY_REG_PC), Shift::new(0))
  }
  pub(crate) fn sreg_vmid(&self) -> Src {
    Src::Reg(Reg::new_special(register_file::SHADY_REG_VMID), Shift::new(0))
  }
  pub(crate) fn sreg_sh(&self, reg: u8, shift: i8) -> Src {
    Src::Reg(Reg::new(reg), Shift::new(shift))
  }
  pub(crate) fn immv(&self, ival: i16) -> Src {
    Src::Imm(ival)
  }

  pub(crate) fn with_suppress_flags(&mut self) -> &mut Self {
    self.set_flags_for_next = false;
    self
  }
  fn with_cond(&mut self, cond: Cond) -> &mut Self {
    self.cond_for_next = cond;
    self
  }
  pub(crate) fn with_ifeq(&mut self) -> &mut Self {
    self.with_cond(Cond::Equal)
  }
  pub(crate) fn with_ifz(&mut self) -> &mut Self {
    self.with_cond(Cond::Equal)
  }
  pub(crate) fn with_ifne(&mut self) -> &mut Self {
    self.with_cond(Cond::NotEqual)
  }
  pub(crate) fn with_ifnz(&mut self) -> &mut Self {
    self.with_cond(Cond::NotEqual)
  }
  pub(crate) fn with_iflt(&mut self) -> &mut Self {
    self.with_cond(Cond::Less)
  }
  pub(crate) fn with_ifle(&mut self) -> &mut Self {
    self.with_cond(Cond::LessEqual)
  }
  pub(crate) fn with_ifgt(&mut self) -> &mut Self {
    self.with_cond(Cond::Greater)
  }
  pub(crate) fn with_ifge(&mut self) -> &mut Self {
    self.with_cond(Cond::GreaterEqual)
  }

  pub(crate) fn declare_label(&mut self, name: &'static str) {
    self.labels.push(Label { name: name.to_string(), pos: None })
  }
  pub(crate) fn bind_label(&mut self, name: &'static str) {
    let pos = self.buffer.len();
    let label =
      self.labels.iter_mut().find(|l| l.name == name)
        .expect("Label not found");
    label.pos = Some(pos)
  }

  pub(crate) fn emit_mov(&mut self, d: Dst, s1: Src) {
    self.emit_std_compute(d, Op::Add, s1, Src::Imm(0))
  }
  pub(crate) fn emit_add(&mut self, d: Dst, s1: Src, s2: Src) {
    self.emit_std_compute(d, Op::Add, s1, s2)
  }
  pub(crate) fn emit_sub(&mut self, d: Dst, s1: Src, s2: Src) {
    if let Src::Imm(ival) = s2 {
      assert!(ival >= i16::MIN);
      self.emit_std_compute(d, Op::Add, s1, Src::Imm(-ival))
    } else {
      self.emit_std_compute(d, Op::Sub, s1, s2)
    }
  }
  pub(crate) fn emit_mul(&mut self, d: Dst, s1: Src, s2: Src) {
    self.emit_std_compute(d, Op::Mul, s1, s2)
  }
  pub(crate) fn emit_div(&mut self, d: Dst, s1: Src, s2: Src) {
    self.emit_std_compute(d, Op::Div, s1, s2)
  }
  pub(crate) fn emit_mod(&mut self, d: Dst, s1: Src, s2: Src) {
    self.emit_std_compute(d, Op::Mod, s1, s2)
  }
  pub(crate) fn emit_bitand(&mut self, d: Dst, s1: Src, s2: Src) {
    self.emit_std_compute(d, Op::BitAnd, s1, s2)
  }
  pub(crate) fn emit_bitor(&mut self, d: Dst, s1: Src, s2: Src) {
    self.emit_std_compute(d, Op::BitOr, s1, s2)
  }
  pub(crate) fn emit_bitxor(&mut self, d: Dst, s1: Src, s2: Src) {
    self.emit_std_compute(d, Op::BitXor, s1, s2)
  }
  pub(crate) fn emit_max(&mut self, d: Dst, s1: Src, s2: Src) {
    self.emit_std_compute(d, Op::Max, s1, s2)
  }
  pub(crate) fn emit_min(&mut self, d: Dst, s1: Src, s2: Src) {
    self.emit_std_compute(d, Op::Max, s1, s2)
  }

  pub(crate) fn emit_jump(&mut self, label: &'static str) {
    if ! self.has_label(label) {
      panic!("Label not found: {}", label)
    }
    self.emit_control_flow(Cflow::Jump(label))
  }
  pub(crate) fn emit_call(&mut self, label: &'static str) {
    if ! self.has_label(label) {
      panic!("Label not found: {}", label)
    }
    self.emit_control_flow(Cflow::Call(label))
  }
  pub(crate) fn emit_ret(&mut self) {
    self.emit_control_flow(Cflow::Return)
  }

  pub(crate) fn emit_load(&mut self, d: Dst, ival: i32) {
    self.emit_next_instruction(Variant::new_imm32(d, ival))
  }

  pub(crate) fn emit_terminate(&mut self) {
    self.emit_next_instruction(Variant::new_terminate())
  }

  fn reset_after_emit(&mut self) {
    self.set_flags_for_next = true;
    self.cond_for_next = Cond::Always;
  }

  fn emit_next_instruction(&mut self, variant: Variant) {
    let ins = Ins::new(self.cond_for_next, self.set_flags_for_next, variant);
    self.buffer.push(ins);
    self.reset_after_emit();
  }

  fn emit_std_compute(&mut self, d: Dst, op: Op, s1: Src, s2: Src) {
    self.emit_next_instruction(Variant::new_compute(d, op, s1, s2));
  }

  fn emit_control_flow(&mut self, cflow: Cflow) {
    self.emit_next_instruction(Variant::new_cflow(cflow))
  }

  fn has_label(&mut self, name: &'static str) -> bool {
    self.labels.iter().any(|l| l.name == name)
  }

  fn validate(&self) -> Result<(), String> {
    for label in &self.labels {
      if let Some(pos) = label.pos {
        if pos >= self.buffer.len() {
          return Err(format!("Label {} out of bounds: {}", label.name, pos));
        }
      } else {
        return Err(format!("Label not bound: {}", label.name))
      }
    }
    Ok(())
  }

  pub(crate) fn assemble_program(&mut self) -> Result<ShadyProgram, String> {
    self.validate()?;
    let labels = &self.labels;
    let mut instructions = Vec::new();
    for (i, ins) in self.buffer.iter().enumerate() {
      instructions.push(
        ins.to_bitcode(
          i as u32,
          |label| {
            labels.iter().find(|l| l.name == label)
              .expect("Label not found")
              .pos.expect("Label not bound")
              as u32
          },
        )
      );
    }
    Ok(ShadyProgram { bitcode: instructions })
  }
}

/**
 * A label in the bytecode.
 */
struct Label {
  name: String,
  pos: Option<usize>,
}
