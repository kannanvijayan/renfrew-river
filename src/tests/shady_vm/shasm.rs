
use crate::gpu::shady_vm;
use chumsky::prelude::Parser;

#[test]
fn test_shasm_parse_instr_simple_1() {
    let input = "add r0, r1, r2";
    let expected = shady_vm::ShasmInstrParseResult {
      instr: shady_vm::bitcode::Instruction {
        op_word: shady_vm::bitcode::OpWord {
          kind: shady_vm::bitcode::OperationKind::Add,
          cond: shady_vm::bitcode::Condition::Always,
          set_flags: true,
          imm_src1: false,
          imm_src2: false,
          shift16_src2: false,
          ind_src1: false,
          ind_src2: false,
          ind_dst: false,
          cflow: shady_vm::bitcode::ControlFlow::None,
        },
        dst_word: shady_vm::bitcode::DstWord {
          reg: 0,
          bump: 0,
          negate: false,
        },
        src1_word: shady_vm::bitcode::SrcWord::Register {
          reg: 1,
          shift: 0,
          negate: false,
        },
        src2_word: shady_vm::bitcode::SrcWord::Register {
          reg: 2,
          shift: 0,
          negate: false,
        },
      },
      path_label: None,
    };
    let actual = shady_vm::shasm_instr_parser().parse(input);
    let output = actual.output().unwrap();
    assert_eq!(output, &expected);
}

#[test]
fn test_shasm_parse_instr_simple_2() {
    let input = "ifeq add *r0, r1 shift 5 neg, 9";
    let expected = shady_vm::ShasmInstrParseResult {
      instr: shady_vm::bitcode::Instruction {
        op_word: shady_vm::bitcode::OpWord {
          kind: shady_vm::bitcode::OperationKind::Add,
          cond: shady_vm::bitcode::Condition::Equal,
          set_flags: true,
          imm_src1: false,
          imm_src2: true,
          shift16_src2: false,
          ind_src1: false,
          ind_src2: false,
          ind_dst: true,
          cflow: shady_vm::bitcode::ControlFlow::None,
        },
        dst_word: shady_vm::bitcode::DstWord {
          reg: 0,
          bump: 0,
          negate: false,
        },
        src1_word: shady_vm::bitcode::SrcWord::Register {
          reg: 1,
          shift: 5,
          negate: true,
        },
        src2_word: shady_vm::bitcode::SrcWord::Immediate {
          value: 9,
        },
      },
      path_label: None,
    };
    let actual = shady_vm::shasm_instr_parser().parse(input);
    let output = actual.output().unwrap();
    assert_eq!(output, &expected);
}
