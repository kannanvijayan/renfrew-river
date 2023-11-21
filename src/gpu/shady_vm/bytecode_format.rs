#[derive(Clone, Copy, Debug)]
pub(crate) struct ShadyInsBitField {
  offset: u8,
  nbits: u8,
}
impl ShadyInsBitField {
  pub(crate) const fn offset(self) -> u32 { self.offset as u32 }
  pub(crate) const fn nbits(self) -> u32 { self.nbits as u32 }
  pub(crate) const fn mask(self) -> u32 {
    (1 << self.nbits) - 1
  }

  pub(crate) const fn extract(self, ins: u32) -> u32 {
    (ins >> self.offset) & self.mask()
  }
  pub(crate) const fn encode(self, value: u32) -> u32 {
    (value & self.mask()) << self.offset
  }
}

/** Offset and mask of condition. */
pub(crate) const SHADY_INS_FIELD_COND: ShadyInsBitField = ShadyInsBitField {
  offset: 0,
  nbits: 3,
};

/** Offset and mask of X0. */
pub(crate) const SHADY_INS_FIELD_X0: ShadyInsBitField = ShadyInsBitField {
  offset: 3,
  nbits: 6,
};

/** Offset and mask of X1. */
pub(crate) const SHADY_INS_FIELD_X1: ShadyInsBitField = ShadyInsBitField {
  offset: 9,
  nbits: 6,
};

/** Offset and mask of operation */
pub(crate) const SHADY_INS_FIELD_OP: ShadyInsBitField = ShadyInsBitField {
  offset: 15,
  nbits: 4,
};

/** Offset and mask of X2. */
pub(crate) const SHADY_INS_FIELD_X2: ShadyInsBitField = ShadyInsBitField {
  offset: 19,
  nbits: 6,
};

/** Offset and mask of data-flow. */
pub(crate) const SHADY_INS_FIELD_DF: ShadyInsBitField = ShadyInsBitField {
  offset: 25,
  nbits: 2,
};

/** Offset and mask of SetFlags bit. */
pub(crate) const SHADY_INS_FIELD_SETFLAG: ShadyInsBitField = ShadyInsBitField {
  offset: 27,
  nbits: 1,
};

/** Offset and mask of X0 immediate flag. */
pub(crate) const SHADY_INS_FIELD_X0_IMM: ShadyInsBitField = ShadyInsBitField {
  offset: 28,
  nbits: 1,
};

/** Offset and mask of X1 immediate flag. */
pub(crate) const SHADY_INS_FIELD_X1_IMM: ShadyInsBitField = ShadyInsBitField {
  offset: 29,
  nbits: 1,
};

#[derive(Clone, Copy, Debug)]
#[repr(u8)]
pub(crate) enum ShadyInsCond {
  Never               = 0b000,
  LessThan            = 0b001,
  Equal               = 0b010,
  LessThanOrEqual     = 0b011,
  GreaterThan         = 0b100,
  NotEqual            = 0b101,
  GreaterThanOrEqual  = 0b110,
  Always              = 0b111,
}
impl std::ops::BitOr<ShadyInsCond> for ShadyInsCond {
  type Output = ShadyInsCond;
  fn bitor(self, rhs: Self) -> Self::Output {
    unsafe { std::mem::transmute(self as u8 | rhs as u8) }
  }
}

#[derive(Clone, Copy, Debug)]
#[repr(u8)]
pub(crate) enum ShadyInsOp {
  Immed = 0b0000_0000,
  Add = 0b0000_0001,
  Sub = 0b0000_0010,
  Mul = 0b0000_0011,
  Div = 0b0000_0100,
  Mod = 0b0000_0101,
  Lsh = 0b0000_0110,
  Rsh = 0b0000_0111,
  And = 0b0000_1000,
  Or  = 0b0000_1001,
  Xor = 0b0000_1010,
}

#[derive(Clone, Copy, Debug)]
#[repr(u8)]
pub(crate) enum ShadyInsDf {
  MovOrJump = 0b00,
  ReadOrCall = 0b01,
  WriteOrRet = 0b10,
  WriteImmOrEnd = 0b11,
}

pub(crate) const SHADY_MAX_REG: u8 = 63;

pub(crate) const SHADY_REG_CFLOW: u8 = 63;
