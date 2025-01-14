import { Condition, ControlFlow, OperationKind, SHADY_INS_DST_BUMP_OFFSET, SHADY_INS_DST_NEGATE_OFFSET, SHADY_INS_DST_REG_OFFSET, SHADY_INS_OP_CFLOW_OFFSET, SHADY_INS_OP_COND_OFFSET, SHADY_INS_OP_IMMSRC1_OFFSET, SHADY_INS_OP_IMMSRC2_OFFSET, SHADY_INS_OP_INDDST_OFFSET, SHADY_INS_OP_INDSRC1_OFFSET, SHADY_INS_OP_INDSRC2_OFFSET, SHADY_INS_OP_KIND_OFFSET, SHADY_INS_OP_SETFLAGS_OFFSET, SHADY_INS_OP_SHIFT16_OFFSET, SHADY_INS_SRC_REG_OFFSET, SHADY_REG_PC, SHADY_REG_VMID } from "./constants"


export enum OperationKindName {
  Add = "Add",
  Mul = "Mul",
  Div = "Div",
  Mod = "Mod",
  BitAnd = "BitAnd",
  BitOr = "BitOr",
  BitXor = "BitXor",
  Max = "Max",
}

export enum ConditionName {
  Never = "Never",
  Equal = "Equal",
  Less = "Less",
  LessEqual = "LessEqual",
  Greater = "Greater",
  GreaterEqual = "GreaterEqual",
  NotEqual = "NotEqual",
  Always = "Always",
}

export enum ControlFlowName {
  None = "None",
  Write = "Write",
  Call = "Call",
  Ret = "Ret",
}

export type OpWord = {
  cond: Condition,
  setFlags: boolean,
  immSrc1: boolean,
  immSrc2: boolean,
  shift16Src2: boolean,
  indSrc1: boolean,
  indSrc2: boolean,
  indDst: boolean,
  kind: OperationKind,
  cflow: ControlFlow,
}

export type DstWord = {
  reg: number,
  negate: boolean,
  bump: number,
}

export type SrcWord = {
  reg: number,
  negate: boolean,
  shift: number,
}

export type Instruction = {
  op: OpWord,
  dst: DstWord,
  src1: SrcWord,
  src2: SrcWord,
}

function zeroed_instruction(): Instruction {
  return {
    op: {
      cond: Condition.Always,
      setFlags: false,
      immSrc1: false,
      immSrc2: false,
      shift16Src2: false,
      indSrc1: false,
      indSrc2: false,
      indDst: false,
      kind: OperationKind.Add,
      cflow: ControlFlow.None,
    },
    dst: { reg: 0, negate: false, bump: 0 },
    src1: { reg: 0, negate: false, shift: 0 },
    src2: { reg: 0, negate: false, shift: 0 },
  }
}

export function parse_instruction(instr: string): Instruction {
  let rest = instr.trim();
  const result = zeroed_instruction();

  { // parse condition
    const [cond, r] = extract_condition(rest);
    if (cond) {
      result.op.cond = cond;
      rest = ensure_keyword_follow(r);
    }
  }

  rest = expect_whitespace(rest);

  { // parse control flow (goto or call)
    const [cflow, r] = extract_control_flow(rest);
    if (cflow) {
      result.op.cflow = cflow;
      rest = ensure_keyword_follow(r);
    }
  }

  rest = expect_whitespace(rest);

  { // parse operation kind
    const [kind, r] = extract_operation_kind(rest);
    if (kind === undefined) {
      throw new Error("required operation kind");
    }
    result.op.kind = kind;
    rest = ensure_keyword_follow(r);
  }

  rest = expect_whitespace(rest);

  { // parse destination
    const [dst, indDst, r] = extract_dst(rest);
    result.dst = dst;
    if (indDst) {
      result.op.indDst = true;
    }
    rest = r;
  }

  rest = expect_whitespace(rest);
  rest = expect_comma(rest);

  { // parse source 1
    const [src, indSrc, r] = extract_src(rest);
    result.src1 = src;
    if (indSrc) {
      result.op.indSrc1 = true;
    }
    rest = ensure_keyword_follow(r);
  }

  rest = expect_whitespace(rest);
  rest = expect_comma(rest);

  { // parse source 2
    const [src, indSrc, r] = extract_src(rest);
    result.src2 = src;
    if (indSrc) {
      result.op.indSrc2 = true;
    }
    rest = ensure_keyword_follow(r);
  }

  return result;
}

function extract_condition(rest: string): [Condition | undefined, string] {
  const match_cond = match_token<Condition | undefined>(
    rest,
    /^(ifeq|ifne|iflt|ifle|ifgt|ifge)/,
    (match) => {
      switch (match[0]) {
        case "ifeq": return Condition.Equal;
        case "ifne": return Condition.NotEqual;
        case "iflt": return Condition.Less;
        case "ifle": return Condition.LessEqual;
        case "ifgt": return Condition.Greater;
        case "ifge": return Condition.GreaterEqual;
      }
    }
  );
  return [match_cond[0], match_cond[1]];
}

function extract_control_flow(rest: string): [ControlFlow | undefined, string] {
  const match_cflow = match_token<ControlFlow | undefined>(
    rest,
    /^(goto|call|ret)/,
    (match) => {
      switch (match[0]) {
        case "goto": return ControlFlow.Write;
        case "call": return ControlFlow.Call;
        case "ret": return ControlFlow.Ret;
      }
    }
  );
  return [match_cflow[0], match_cflow[1]];
}

function extract_operation_kind(rest: string): [OperationKind | undefined, string] {
  return match_token<OperationKind | undefined>(
    rest,
    /^(add|mul|div|mod|bitand|bitor|bitxor|max)/,
    (match) => {
      switch (match[0]) {
        case "add": return OperationKind.Add;
        case "mul": return OperationKind.Mul;
        case "div": return OperationKind.Div;
        case "mod": return OperationKind.Mod;
        case "bitand": return OperationKind.BitAnd;
        case "bitor": return OperationKind.BitOr;
        case "bitxor": return OperationKind.BitXor;
        case "max": return OperationKind.Max;
      }
    }
  );
}

function extract_dst(rest: string): [DstWord, boolean, string] {
  const result: DstWord = { reg: 0, negate: false, bump: 0 };
  let ind: boolean = false;

  { // parse optional destination modifier
    const [shift, neg, r] = extract_dst_mod(rest);
    if (shift) {
      result.bump = shift;
    }
    if (neg) {
      result.negate = true;
    }
    if (shift || neg) {
      rest = ensure_keyword_follow(r);
    }
  }

  rest = expect_whitespace(rest);

  { // parse destination register
    const [reg, i, r] = extract_reg(rest);
    result.reg = reg;
    ind = i;
    rest = ensure_keyword_follow(r);
  }

  return [result, ind, rest];
}

function extract_src(rest: string): [SrcWord, boolean, string] {
  const result: SrcWord = { reg: 0, negate: false, shift: 0 };
  let ind: boolean = false;

  { // parse source register
    const [reg, i, r] = extract_reg(rest);
    result.reg = reg;
    if (i) {
      ind = true;
    }
    rest = ensure_keyword_follow(r);
  }

  rest = expect_whitespace(rest);

  { // parse optional source modifier
    const [shift, neg, r] = extract_src_mod(rest);
    if (shift) {
      result.shift = shift;
    }
    if (neg) {
      result.negate = true;
    }
    rest = ensure_keyword_follow(r);
  }

  return [result, ind, rest];
}

function extract_dst_mod(rest: string): [number | undefined, boolean, string] {
  const [match_mod, r0] = match_token(
    rest,
    /^\(([-+]?)(\d+)(\s*;\s*neg)?\)/,
    (match) => {
      const sign = match[1] === "-" ? -1 : 1;
      const shift = parseInt(match[2], 10) * sign;
      const neg = !!match[3];
      return { shift, neg };
    }
  );
  if (match_mod) {
    return [match_mod.shift, match_mod.neg, r0];
  }

  const [match_neg, r1] = match_token(
    rest,
    /^\(\s*(neg)\s*\)/,
    () => true
  );
  if (match_neg) {
    return [undefined, true, r1];
  }

  return [undefined, false, rest];
}

function extract_src_mod(rest: string): [number | undefined, boolean, string] {
  const [match_shift, r0] = match_token(
    rest,
    /^shift\s+([-+]?)\s*(\d+)\s*(neg)?/,
    (match) => {
      const sign = match[1] === "-" ? -1 : 1;
      const shift = parseInt(match[2], 10) * sign;
      if (shift > 31 || shift < -31) {
        throw new Error("shift out of range");
      }
      const neg = !!match[3];
      return { shift, neg };
    }
  );
  if (match_shift) {
    return [match_shift.shift, match_shift.neg, r0];
  }

  const [match_neg, r1] = match_token(
    rest,
    /^(neg)/,
    () => true
  );
  if (match_neg) {
    return [undefined, true, r1];
  }

  return [undefined, false, rest];
}

function extract_reg(rest: string): [number, boolean, string] {
  const [match_reg, r0] = match_token(
    rest,
    /^\*?r(\d+|_vmid|_pc)/,
    (match) => {
      const ind = match[0].startsWith("*");
      if (match[1] === "_vmid") {
        return { reg: SHADY_REG_VMID, ind };
      }
      if (match[1] === "_pc") {
        return { reg: SHADY_REG_PC, ind };
      }
      const reg = parseInt(match[1], 10);
      if (reg < 0 || reg > 255) {
        throw new Error("register out of range");
      }
      return { reg, ind };
    }
  );
  if (match_reg) {
    return [match_reg.reg, match_reg.ind, r0];
  }
  throw new Error("required register");
}

function ensure_keyword_follow(rest: string): string {
  if (rest.match(/^[a-zA-Z0-9_]/)) {
    throw new Error("alphanmueric after keyword");
  }
  return rest;
}

function expect_whitespace(rest: string): string {
  return rest.trimStart();
}

function expect_comma(rest: string): string {
  const match = rest.match(/^\s*,\s*/);
  if (!match) {
    throw new Error("expected comma");
  }
  return rest.slice(match[0].length);
}

function match_token<T>(
  rest: string,
  token: RegExp,
  onMatch: (match: RegExpMatchArray) => T
): [T | undefined, string] {
  const match = rest.match(token);
  if (match) {
    return [onMatch(match), rest.slice(match[0].length)];
  }
  return [undefined, rest.trimStart()];
}


//
// INSTR ::=
//   | CND? CFLOW? OP DST "," SRC "," SRC
//
// CND ::= "ifeq" | "ifne" | "iflt" | "ifle" | "ifgt" | "ifge"
// OP ::= "add" | "mul" | "div" | "mod" | "bitand" | "bitor" | "bitxor" | "max"
// DST_MOD ::= "(" IMM7 (";" "neg")? ")"
// DST ::= DST_MOD? REG
// SRC_MOD ::= ("shift" IMM6 ("neg")?) | "neg"
// SRC ::= REG SRC_MOD? | IMM16
// CFLOW ::= "goto" | "call"
// REG = "*"? "r0" .. "r255"


export function encodeInstruction(instr: Instruction): [number, number] {
  const op = encodeOp(instr.op);
  const dst = encodeDst(instr.dst);
  const src1 = encodeSrc(instr.src1);
  const src2 = encodeSrc(instr.src2);

  return [op | (dst << 16), src1 | (src2 << 16)];
}

function encodeOp(op: OpWord): number {
  let bits = 0;
  bits |= (op.cond as number) << SHADY_INS_OP_COND_OFFSET;
  bits |= (op.setFlags ? 1 : 0) << SHADY_INS_OP_SETFLAGS_OFFSET;
  bits |= (op.immSrc1 ? 1 : 0) << SHADY_INS_OP_IMMSRC1_OFFSET;
  bits |= (op.immSrc2 ? 1 : 0) << SHADY_INS_OP_IMMSRC2_OFFSET;
  bits |= (op.shift16Src2 ? 1 : 0) << SHADY_INS_OP_SHIFT16_OFFSET;
  bits |= (op.indSrc1 ? 1 : 0) << SHADY_INS_OP_INDSRC1_OFFSET;
  bits |= (op.indSrc2 ? 1 : 0) << SHADY_INS_OP_INDSRC2_OFFSET;
  bits |= (op.indDst ? 1 : 0) << SHADY_INS_OP_INDDST_OFFSET;
  bits |= (op.kind as number) << SHADY_INS_OP_KIND_OFFSET;
  bits |= (op.cflow as number) << SHADY_INS_OP_CFLOW_OFFSET;
  return bits;
}

function encodeDst(dst: DstWord): number {
  let bits = 0;
  bits |= dst.reg << SHADY_INS_DST_REG_OFFSET;
  bits |= (dst.negate ? 1 : 0) << SHADY_INS_DST_NEGATE_OFFSET;
  bits |= dst.bump << SHADY_INS_DST_BUMP_OFFSET;
  return bits;
}

function encodeSrc(src: SrcWord): number {
  let bits = 0;
  bits |= src.reg << SHADY_INS_SRC_REG_OFFSET;
  bits |= (src.negate ? 1 : 0) << SHADY_INS_DST_NEGATE_OFFSET;
  bits |= src.shift << SHADY_INS_DST_BUMP_OFFSET;
  return bits;
}
