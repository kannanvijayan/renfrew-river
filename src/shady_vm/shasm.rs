use std::collections::HashMap;
use chumsky::{error::EmptyErr, Parser};
use regex::Regex;
use super::{
  bitcode::{
    self,
    SHADY_INS_DST_BUMP_MAX,
    SHADY_INS_DST_BUMP_MIN,
    SHADY_INS_SRC_IMM_MAX,
    SHADY_INS_SRC_IMM_MIN,
    SHADY_INS_SRC_SHIFT_MAX,
    SHADY_INS_SRC_SHIFT_MIN,
  },
  register_file::{ SHADY_REG_COUNT,
    SHADY_REG_PC,
    SHADY_REG_VMID
  },
  ShadyProgram,
};

#[derive(Debug, Clone)]
#[derive(serde::Deserialize, serde::Serialize)]
pub(crate) struct ShasmProgram {
  #[serde(rename = "programText")]
  pub(crate) program_text: String,
}
impl ShasmProgram {
  pub(crate) fn new(program_text: String) -> ShasmProgram {
    ShasmProgram { program_text }
  }

  pub(crate) fn new_example() -> ShasmProgram {
    ShasmProgram::new(r#"add r0, r1, r2"#.to_string())
  }

  pub(crate) fn to_validated(text: &str) -> Result<ShasmProgram, ShasmProgramValidation> {
    match shasm_program_parser(text) {
      Ok(_program) => Ok(ShasmProgram::new(text.to_string())),
      Err(errors) => Err(ShasmProgramValidation { errors }),
    }
  }
}

#[derive(Debug, Clone)]
#[derive(serde::Deserialize, serde::Serialize)]
pub(crate) struct ShasmProgramValidation {
  pub(crate) errors: Vec<ShasmParseError>,
}
impl ShasmProgramValidation {
  pub(crate) fn is_valid(&self) -> bool {
    self.errors.is_empty()
  }
}

#[derive(Debug, Clone)]
#[derive(serde::Deserialize, serde::Serialize)]
pub(crate) struct ShasmParseError {
  #[serde(rename = "lineNo")]
  pub(crate) line_no: usize,

  pub(crate) message: String,
}
impl ShasmParseError {
  pub(crate) fn new(line_no: usize, message: String) -> ShasmParseError {
    ShasmParseError { line_no, message }
  }

  pub(crate) fn to_string(&self) -> String {
    format!("Line {}: {}", self.line_no, self.message)
  }
}

/**
 * Parse an entire shady program.
 */
pub(crate) fn shasm_program_parser<'a>(program_text: &'a str)
  -> Result<ShadyProgram, Vec<ShasmParseError>>
{
  let mut instrs = Vec::<bitcode::Instruction>::new();
  let mut labels = HashMap::<String, LabelInfo>::new();
  let mut errors = Vec::<ShasmParseError>::new();

  for (line_no, line) in program_text.lines().enumerate() {
    let line = line.trim();
    if line.is_empty() {
      continue;
    }

    let label_regex = Regex::new(r"^\s*@\w+:\s*$").unwrap();
    if label_regex.is_match(line) {
      let label = line.trim()[1..].trim();
      let ent = labels.entry(label.to_string()).or_insert(LabelInfo::new());
      ent.bind_offset = Some(line_no);
      continue;
    }

    let parse_result = shasm_instr_parser().parse(line);
    if parse_result.errors().len() > 0 {
      for err in parse_result.errors() {
        let message = format!("Error parsing instruction: {}", err);
        errors.push(ShasmParseError { line_no, message });
      }
      continue;
    }
    let instr = parse_result.output().unwrap();
    instrs.push(instr.instr);
    if let Some(label) = &instr.path_label {
      let ent = labels.entry(label.clone()).or_insert(LabelInfo::new());
      ent.use_offsets.push(line_no);
    }
  }

  // Patch up the labels.
  for (label, info) in labels.iter() {
    // Ensure the label was bound.
    let bind_offset = match info.bind_offset {
      Some(offset) => offset,
      None => {
        errors.push(ShasmParseError {
          line_no: 0,
          message: format!("Label '{}' not found", label),
        });
        continue;
      }
    };
    // Validate binding offset.
    if bind_offset >= instrs.len() {
      errors.push(ShasmParseError {
        line_no: bind_offset,
        message: format!("Label '{}' bind offset out of bounds", label),
      });
      continue;
    }
    // Patch Uses.
    for &use_offset in &info.use_offsets {
      let offset_delta = bind_offset as i32 - use_offset as i32;
      if offset_delta < SHADY_INS_SRC_IMM_MIN as i32
      || offset_delta > SHADY_INS_SRC_IMM_MAX as i32 {
        errors.push(ShasmParseError {
          line_no: use_offset,
          message: format!("Label '{}' offset delta out of bounds", label),
        });
        continue;
      }
      // Control flow instructions emit "add r_pc, r_pc, offset" instructions,
      // so we want to patch src2.
      instrs[use_offset].src2_word = bitcode::SrcWord::Immediate {
        value: offset_delta as i16,
      };
    }
  }

  if errors.len() > 0 {
    return Err(errors);
  }

  Ok(ShadyProgram::new(instrs))
}

struct LabelInfo {
  bind_offset: Option<usize>,
  use_offsets: Vec<usize>,
}
impl LabelInfo {
  fn new() -> LabelInfo {
    LabelInfo { bind_offset: None, use_offsets: Vec::new() }
  }
}

#[derive(Debug, PartialEq)]
pub(crate) struct ShasmInstrParseResult {
  pub(crate) instr: bitcode::Instruction,
  pub(crate) path_label: Option<String>,
}

/**
 * A parser for the Shady Assembly language.
 */
pub(crate) fn shasm_instr_parser<'a>()
  -> impl Parser<'a, &'a str, ShasmInstrParseResult>
{
  use chumsky::prelude::choice;
  let noflags_prefix = noflags_prefix_parser();
  let cond_prefix = cond_prefix_parser();

  // Followed by a compute, cflow, or imm32load instruction.
  noflags_prefix.then(cond_prefix).then(
    choice([
      compute_instr_parser().map(|instr| (None, instr)).boxed(),
      cflow_instr_parser().map(|(instr, label)| (label, instr)).boxed(),
      imm32load_instr_parser().map(|instr| (None, instr)).boxed(),
    ])
  ).map(|((noflags, cond), (path_label, instr))| {
    let mut op_word = instr.op_word;
    op_word.cond = cond;
    op_word.set_flags = !noflags;
    let dst_word = instr.dst_word;
    let src1_word = instr.src1_word;
    let src2_word = instr.src2_word;
    let instr = bitcode::Instruction { op_word, dst_word, src1_word, src2_word };
    ShasmInstrParseResult { instr, path_label }
  })
}


fn noflags_prefix_parser<'a>() -> impl Parser<'a, &'a str, bool> {
  use chumsky::text::keyword;

  keyword("noflags").or_not().padded().map(|nf| nf.is_some())
}

fn cond_prefix_parser<'a>() -> impl Parser<'a, &'a str, bitcode::Condition> {
  use chumsky::prelude::choice;
  use chumsky::text::keyword;

  choice([
    keyword("ifeq").map(|_| bitcode::Condition::Equal).boxed(),
    keyword("ifne").map(|_| bitcode::Condition::NotEqual).boxed(),
    keyword("iflt").map(|_| bitcode::Condition::Less).boxed(),
    keyword("ifle").map(|_| bitcode::Condition::LessEqual).boxed(),
    keyword("ifgt").map(|_| bitcode::Condition::Greater).boxed(),
    keyword("ifge").map(|_| bitcode::Condition::GreaterEqual).boxed(),
  ]).or_not().padded().map(|c| c.unwrap_or(bitcode::Condition::Always))
}

fn compute_instr_parser<'a>()
  -> impl Parser<'a, &'a str, bitcode::Instruction>
{
  use chumsky::prelude::just;
  let op_parser = op_parser();
  let dst_parser = dst_parser();
  let src1_parser = src_parser();
  let src2_parser = src_parser();

  op_parser.then(dst_parser)
    .then_ignore(just(",").padded())
    .then(src1_parser)
    .map(|((op, (dst, dst_ind)), (src1, src1_ind))| {
      (op, (dst, dst_ind), (src1, src1_ind))
    })
    .then_ignore(just(",").padded())
    .then(src2_parser)
    .map(|((kind, (dst, ind_dst), (src1, ind_src1)), (src2, ind_src2))| {
      let op_word = bitcode::OpWord {
        cond: bitcode::Condition::Always,
        set_flags: false,
        imm_src1: src1.is_immediate(),
        imm_src2: src2.is_immediate(),
        shift16_src2: false,
        ind_src1,
        ind_src2,
        ind_dst,
        kind,
        cflow: bitcode::ControlFlow::None,
      };
      let dst_word = dst;
      let src1_word = src1;
      let src2_word = src2;
      bitcode::Instruction { op_word, dst_word, src1_word, src2_word }
    })
}

fn cflow_instr_parser<'a>()
  -> impl Parser<'a, &'a str, (bitcode::Instruction, Option<String>)>
{
  use chumsky::prelude::choice;
  use chumsky::text::{ keyword, ident };

  choice([
    keyword("call").padded().ignore_then(ident().padded())
      .map(|name: &str| (bitcode::ControlFlow::Call, Some(name.to_string())))
      .boxed(),
    keyword("goto").padded().ignore_then(ident().padded())
      .map(|name: &str| (bitcode::ControlFlow::Write, Some(name.to_string())))
      .boxed(),
    keyword("ret").padded().map(|_| (bitcode::ControlFlow::Ret, None)).boxed(),
  ]).map(|(cflow, label)| {
    let op_word = bitcode::OpWord {
      cond: bitcode::Condition::Always,
      set_flags: false,
      imm_src1: false,
      imm_src2: true,
      shift16_src2: false,
      ind_src1: false,
      ind_src2: false,
      ind_dst: false,
      kind: bitcode::OperationKind::Add,
      cflow,
    };
    let dst_word = bitcode::DstWord { reg: 0, bump: 0, negate: false };
    let src1_word = bitcode::SrcWord::Register {
      reg: SHADY_REG_PC,
      shift: 0,
      negate: false,
    };
    let src2_word = bitcode::SrcWord::Immediate { value: 0 };
    let instr = bitcode::Instruction { op_word, dst_word, src1_word, src2_word };
    (instr, label)
  })
}

fn imm32load_instr_parser<'a>()
  -> impl Parser<'a, &'a str, bitcode::Instruction>
{
  use chumsky::prelude::just;
  use chumsky::text::keyword;

  keyword("imm32load").padded()
    .ignore_then(dst_parser())
    .then_ignore(just(",").padded())
    .then(signed_int_parser())
    .map(|((dst, ind_dst), imm)| {
      let uimm = imm as u32;
      let op_word = bitcode::OpWord {
        cond: bitcode::Condition::Always,
        set_flags: false,
        imm_src1: true,
        imm_src2: true,
        shift16_src2: true,
        ind_src1: false,
        ind_src2: false,
        ind_dst,
        kind: bitcode::OperationKind::Add,
        cflow: bitcode::ControlFlow::None,
      };
      let dst_word = dst;
      let src1_word = bitcode::SrcWord::Immediate {
        value: (imm & 0xFFFF) as i16,
      };
      let src2_word = bitcode::SrcWord::Immediate {
        value: ((imm >> 16) & 0xFFFF) as i16
      };
      bitcode::Instruction { op_word, dst_word, src1_word, src2_word }
    })
}

fn op_parser<'a>() -> impl Parser<'a, &'a str, bitcode::OperationKind> {
  use chumsky::prelude::choice;
  use chumsky::text::keyword;

  choice([
    keyword("add").map(|_| bitcode::OperationKind::Add).boxed(),
    keyword("mul").map(|_| bitcode::OperationKind::Mul).boxed(),
    keyword("div").map(|_| bitcode::OperationKind::Div).boxed(),
    keyword("mod").map(|_| bitcode::OperationKind::Mod).boxed(),
    keyword("bitand").map(|_| bitcode::OperationKind::BitAnd).boxed(),
    keyword("bitor").map(|_| bitcode::OperationKind::BitOr).boxed(),
    keyword("bitxor").map(|_| bitcode::OperationKind::BitXor).boxed(),
    keyword("max").map(|_| bitcode::OperationKind::Max).boxed(),
  ]).padded()
}

fn dst_parser<'a>() -> impl Parser<'a, &'a str, (bitcode::DstWord, bool)> {
  dst_mod_parser().or_not().padded()
    .map(|mb_dstmod| { mb_dstmod.unwrap_or((0, false)) })
    .then(reg_parser())
    .map(|((bump, negate), (reg, ind))| {
      let dst = bitcode::DstWord { reg, bump, negate };
      (dst, ind)
    })
}

fn dst_mod_parser<'a>() -> impl Parser<'a, &'a str, (i8, bool)> {
  use chumsky::prelude::just;
  use chumsky::text::keyword;

  just("(").padded()
    .ignore_then(
      keyword("bump").padded().ignore_then(signed_int_parser()).then(
        just(";").padded()
          .ignore_then(keyword("neg").padded())
          .or_not()
          .map(|neg| neg.is_some())
      )
    )
    .then_ignore(just(")").padded())
    .try_map(|(amt, neg), err| {
      if amt >= SHADY_INS_DST_BUMP_MIN as i32
      && amt <= SHADY_INS_DST_BUMP_MAX as i32
      {
        Ok((amt as i8, neg))
      } else {
        Err(EmptyErr::default())
      }
    })
}

fn src_parser<'a>() -> impl Parser<'a, &'a str, (bitcode::SrcWord, bool)> {
  use chumsky::prelude::choice;
  choice([
    src_reg_parser().boxed(),
    src_imm_parser().boxed(),
  ])
}

fn src_reg_parser<'a>() -> impl Parser<'a, &'a str, (bitcode::SrcWord, bool)> {
  let reg_parser = reg_parser();
  let src_mod_parser = src_mod_parser();

  reg_parser.then(
    src_mod_parser.or_not().map(|mb_srcmod| mb_srcmod.unwrap_or((0, false)))
  ).map(|((reg, ind), (shift, negate))| {
    let src = bitcode::SrcWord::Register { reg, shift, negate };
    (src, ind)
  })
}

fn src_imm_parser<'a>() -> impl Parser<'a, &'a str, (bitcode::SrcWord, bool)> {
  signed_int_parser().padded()
    .try_map(|imm, _err| {
      if imm >= SHADY_INS_SRC_IMM_MIN as i32
      && imm <= SHADY_INS_SRC_IMM_MAX as i32
      {
        Ok(imm as i16)
      } else {
        Err(EmptyErr::default())
      }
    })
    .map(|value| {
      let src = bitcode::SrcWord::Immediate { value };
      (src, false)
    })
}

fn src_mod_parser<'a>() -> impl Parser<'a, &'a str, (i8, bool)> {
  use chumsky::text::keyword;

  keyword("shift").padded()
    .ignore_then(signed_int_parser().padded())
    .or_not().map(|mb_shift| mb_shift.unwrap_or(0))
    .then(keyword("neg").padded().or_not().map(|mb_neg| mb_neg.is_some()))
    .try_map(|(amt, neg), _err| {
      if amt >= SHADY_INS_SRC_SHIFT_MIN as i32
      && amt <= SHADY_INS_SRC_SHIFT_MAX as i32
      {
        Ok((amt as i8, neg))
      } else {
        Err(EmptyErr::default())
      }
    })
}

fn reg_parser<'a>() -> impl Parser<'a, &'a str, (u8, bool)> {
  use chumsky::prelude::{ just, choice };
  use chumsky::text::int;

  just("*").or_not().padded().map(|star| star.is_some())
    .then(
      just("r").ignore_then(
        choice([
          int(10).try_map(
            |regstr: &str, _err| {
              let reg = match regstr.parse::<i32>() {
                Ok(reg) => reg,
                Err(_) => return Err(EmptyErr::default()),
              };
              if reg >= 0 && reg < SHADY_REG_COUNT as i32 {
                Ok(reg as u8)
              } else {
                Err(EmptyErr::default())
              }
            }
          ).boxed(),
          just("_pc").map(|_| SHADY_REG_PC as u8).boxed(),
          just("_vmid").map(|_| SHADY_REG_VMID as u8).boxed(),
        ])
      )
    )
    .padded()
    .map(|(star, reg)| (reg, star))
}

fn signed_int_parser<'a>() -> impl Parser<'a, &'a str, i32> {
  use chumsky::prelude::{ just, choice };
  use chumsky::text::int;

  choice([
    just("+").map(|_| 1_i32).boxed(),
    just("-").map(|_| -1_i32).boxed(),
  ]).or_not().map(|mb_sign| mb_sign.unwrap_or(1)).padded()
    .then(int(10).padded())
    .try_map(|(sign, num): (i32, &str), _err| {
      let num = match num.parse::<u32>() {
        Ok(num) => num,
        Err(_) => return Err(EmptyErr::default()),
      };
      Ok(sign * num as i32)
    })
}
