
// jest test for the assembler.

import { Instruction, parse_instruction } from '../src/shady_vm/assembler';
import { Condition, ControlFlow, OperationKind, SHADY_REG_PC } from '../src/shady_vm/constants';

test('parse_instruction_1', () => {
  const result = parse_instruction("ifeq goto add r_pc, r9, r10");
  const expected: Instruction = {
    op: {
      cond: Condition.Equal,
      cflow: ControlFlow.Write,
      kind: OperationKind.Add,
      indSrc1: false,
      indSrc2: false,
      indDst: false,
      immSrc1: false,
      immSrc2: false,
      setFlags: false,
      shift16Src2: false,
    },
    dst: {
      reg: SHADY_REG_PC,
      negate: false,
      bump: 0,
    },
    src1: {
      reg: 9,
      negate: false,
      shift: 0,
    },
    src2: {
      reg: 10,
      negate: false,
      shift: 0,
    },
  }
  expect(result).toEqual(expected);
});

test('parse_instruction_2', () => {
  const result = parse_instruction("ifeq goto add (-3;neg) r_pc, r9, r10");
  const expected: Instruction = {
    op: {
      cond: Condition.Equal,
      cflow: ControlFlow.Write,
      kind: OperationKind.Add,
      indSrc1: false,
      indSrc2: false,
      indDst: false,
      immSrc1: false,
      immSrc2: false,
      setFlags: false,
      shift16Src2: false,
    },
    dst: {
      reg: SHADY_REG_PC,
      negate: true,
      bump: -3,
    },
    src1: {
      reg: 9,
      negate: false,
      shift: 0,
    },
    src2: {
      reg: 10,
      negate: false,
      shift: 0,
    },
  }
  expect(result).toEqual(expected);
});


test('parse_instruction_3', () => {
  const result = parse_instruction("ifeq goto add (-3;neg) r_pc, r9 shift -9 neg, r10");
  const expected: Instruction = {
    op: {
      cond: Condition.Equal,
      cflow: ControlFlow.Write,
      kind: OperationKind.Add,
      indSrc1: false,
      indSrc2: false,
      indDst: false,
      immSrc1: false,
      immSrc2: false,
      setFlags: false,
      shift16Src2: false,
    },
    dst: {
      reg: SHADY_REG_PC,
      negate: true,
      bump: -3,
    },
    src1: {
      reg: 9,
      negate: true,
      shift: -9,
    },
    src2: {
      reg: 10,
      negate: false,
      shift: 0,
    },
  }
  expect(result).toEqual(expected);
});
