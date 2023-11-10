
use super::bytecode_format::*;

pub(crate) enum ShadyInstruction {
  Arithmetic(ShadyArithmeticInstruction),
  Immediate(ShadyImmediateInstruction),
  ControlFLow(ShadyControlFlowInstruction),
}

pub(crate) struct ShadyRegister(pub(crate) u8);

/*
 * Arithmetic operations:
 *   TTTT-TSSS SSSS-RRRM MMXN-F??D DDDD-KK01
 *   
 *   * TTTTT (5 bits)
 *     - source register 1
 *   * SSSSSSS (7 bits)
 *     - source register 2
 *   * RRR (3 bits)
 *     - source register 2 right-shift amount
 *     - value multiplied by 4 before shift
 *   * MMM (3 bits)
 *     - source register 2 mask specifier
 *     - 0xf, 0xff, 0xfff, 0xffff
 *   * X (1 bit)
 *     - if set, sign-extend the source register 2 value
 *   * N (1 bit)
 *     - if set, negate source register 2 (after flip)
 *   * F (1 bit)
 *     - if set, flip source registers before operation
 *   * DDDDD (5 bits)
 *     - destination register
 *   * KK (2 bits)
 *     - operation kind
 *     - 00 => add, 01 => mul, 10 => divide, 11 => modulo
 */
pub(crate) struct ShadyArithmeticInstruction {
  pub(crate) src_reg1: ShadyRegister,
  pub(crate) src_reg2: ShadyRegister,
  pub(crate) src_reg2_rsh: u8,
  pub(crate) src_reg2_mask: u8,
  pub(crate) src_reg2_sx: bool,
  pub(crate) src_reg2_negate: bool,
  pub(crate) flip: bool,
  pub(crate) dst_reg: ShadyRegister,
  pub(crate) kind: ShadyArithmeticKind,
}
impl ShadyArithmeticInstruction {
  pub(crate) fn encode(&self) -> u32 {
    let mut bcop: u32 = 0;
    bcop |= (self.src_reg1.0 as u32) << SHADY_BCOP_OFFSET_SRCREG1;
    bcop |= (self.src_reg2.0 as u32) << SHADY_BCOP_OFFSET_SRCREG2;
    bcop |= (self.src_reg2_rsh as u32) << SHADY_BCOP_OFFSET_SRCRSH;
    bcop |= (self.src_reg2_mask as u32) << SHADY_BCOP_OFFSET_SRCMASK;
    bcop |= (self.src_reg2_sx as u32) << SHADY_BCOP_OFFSET_SX;
    bcop |= (self.src_reg2_negate as u32) << SHADY_BCOP_OFFSET_NEGATE;
    bcop |= (self.flip as u32) << SHADY_BCOP_OFFSET_FLIP;
    bcop |= (self.dst_reg.0 as u32) << SHADY_BCOP_OFFSET_DSTREG;
    bcop |= (self.kind as u32) << SHADY_BCOP_OFFSET_KIND;
    bcop
  }
}

#[derive(Clone, Copy, Debug)]
#[repr(u8)]
pub(crate) enum ShadyArithmeticKind {
  Add = 0,
  Mul = 1,
  Div = 2,
  Mod = 3,
}

/*
 * Immediate operations:
 *   VVVV-VVVV VVVV-VVVV ??X?-LLLD DDDD-KK10
 *
 *   * VVV...VVV (16-bits)
 *     - immediate value
 *   * X (1 bit)
 *     - if set, sign-extend the value
 *   * LLL (3 bits)
 *     - immediate value left-shift amount
 *     - value multiplied by 4 before shift
 *   * DDDDD (5 bits)
 *     - destination register
 *   * KK (2 bits)
 *     - accumulation kind
 *     - 00 => set, 01 => xor, 10 => and, 11 => or
 */
pub(crate) struct ShadyImmediateInstruction {
  pub(crate) value: u16,
  pub(crate) sx: bool,
  pub(crate) lsh: u8,
  pub(crate) dst_reg: ShadyRegister,
  pub(crate) kind: ShadyImmediateKind,
}

#[derive(Clone, Copy, Debug)]
#[repr(u8)]
pub(crate) enum ShadyImmediateKind {
  Set = 0,
  Xor = 1,
  And = 2,
  Or = 3,
}

/*
 *
 * Control flow operations:
 *   BBBB-BBBB BBBB-BBBB CCCC-CCCC Q???-KK11
 *
 *   * BBBBB...BBBB (16-bits)
 *     - branch target (absolute)
 *   * CCCCCCCC (8 bits)
 *     - condition flags to check
 *   * Q (1 bit)
 *     - flags query kind
 *     - 0 => all flags must be set, 1 => any flag must be set
 *   * KK (2 bits)
 *     - branch kind
 *     - 00 => goto, 01 => call, 10 => return, 11 => end
 */
pub(crate) struct ShadyControlFlowInstruction {
  pub(crate) target: u16,
  pub(crate) flags: u8,
  pub(crate) query_any: bool,
  pub(crate) kind: ShadyControlFlowKind,
}

#[derive(Clone, Copy, Debug)]
#[repr(u8)]
pub(crate) enum ShadyControlFlowKind {
  Goto = 0,
  Call = 1,
  Return = 2,
  End = 3
}