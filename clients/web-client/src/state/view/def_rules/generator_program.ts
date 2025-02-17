import { Reducer } from "@reduxjs/toolkit";
import { ruleset } from "renfrew-river-protocol-client";

type AddFormatWordDialogState = {
  visible: boolean,
  name: string,
};

type AddFormatWordComponentDialogState = {
  visible: boolean,
  name: string,
  startBit: string,
  numBits: string,
};

type GeneratorProgramViewState = {
  format: ruleset.FormatInput,
  addFormatWordDialog: AddFormatWordDialogState,
  addFormatComponentDialog: AddFormatWordComponentDialogState,
  initProgram: string,
  iterations: string,
  pairwiseProgram: string,
  pairwiseOutputRegisters: string,
  mergeProgram: string,
  finalProgram: string,
}

const GeneratorProgramViewState = {
  initialState: {
    format: { wordFormats: [], addWordDialog: false, addComponentDialog: false },
    addFormatWordDialog: {
      visible: false,
      name: "",
    },
    addFormatComponentDialog: {
      visible: false,
      name: "",
      startBit: "",
      numBits: "",
    },
    initProgram: "",
    iterations: "",
    pairwiseProgram: "",
    pairwiseOutputRegisters: "",
    mergeProgram: "",
    finalProgram: "",
  } as GeneratorProgramViewState,

  action: {
    setFormat(formatInput: ruleset.FormatInput): SetFormatAction {
      return {
        type: "set_format" as const,
        formatInput,
      };
    },
    setAddFormatWordDialog(dialog: AddFormatWordDialogState)
      : SetAddFormatWordDialogAction
    {
      return {
        type: "set_add_format_word_dialog" as const,
        dialog,
      };
    },
    setAddFormatComponentDialog(dialog: AddFormatWordComponentDialogState)
      : SetAddFormatWordComponentDialogAction
    {
      return {
        type: "set_add_format_word_component_dialog" as const,
        dialog,
      };
    },
    setInitProgram(initProgram: string): SetInitProgramAction {
      return {
        type: "set_init_program" as const,
        initProgramInput: initProgram,
      };
    },
    setIterations(iterations: string): SetIterationsAction {
      return {
        type: "set_iterations" as const,
        iterationsInput: iterations,
      };
    },
    setPairwiseProgram(pairwiseProgram: string): SetPairwiseProgramAction {
      return {
        type: "set_pairwise_program" as const,
        pairwiseProgramInput: pairwiseProgram,
      };
    },
    setPairwiseOutputRegisters(pairwiseOutputRegisters: string)
      : SetPairwiseOutputRegistersAction
    {
      return {
        type: "set_pairwise_output_registers" as const,
        pairwiseOutputRegistersInput: pairwiseOutputRegisters,
      };
    },
    setMergeProgram(mergeProgram: string): SetMergeProgramAction {
      return {
        type: "set_merge_program" as const,
        mergeProgramInput: mergeProgram,
      };
    },
    setFinalProgram(finalProgram: string): SetFinalProgramAction {
      return {
        type: "set_final_program" as const,
        finalProgramInput: finalProgram,
      };
    },
  },

  reducers: {
    set_format(state: GeneratorProgramViewState, action: SetFormatAction)
      : GeneratorProgramViewState
    {
      return { ...state, format: action.formatInput };
    },
    set_add_format_word_dialog(
      state: GeneratorProgramViewState,
      action: SetAddFormatWordDialogAction
    ): GeneratorProgramViewState {
      return { ...state, addFormatWordDialog: action.dialog };
    },
    set_add_format_word_component_dialog(
      state: GeneratorProgramViewState,
      action: SetAddFormatWordComponentDialogAction
    ): GeneratorProgramViewState {
      return { ...state, addFormatComponentDialog: action.dialog };
    },
    set_init_program(state: GeneratorProgramViewState, action: SetInitProgramAction)
      : GeneratorProgramViewState
    {
      return { ...state, initProgram: action.initProgramInput };
    },
    set_iterations(state: GeneratorProgramViewState, action: SetIterationsAction)
      : GeneratorProgramViewState
    {
      return { ...state, iterations: action.iterationsInput };
    },
    set_pairwise_program(state: GeneratorProgramViewState, action: SetPairwiseProgramAction)
      : GeneratorProgramViewState
    {
      return { ...state, pairwiseProgram: action.pairwiseProgramInput };
    },
    set_pairwise_output_registers(state: GeneratorProgramViewState, action: SetPairwiseOutputRegistersAction)
      : GeneratorProgramViewState
    {
      return {
        ...state,
        pairwiseOutputRegisters: action.pairwiseOutputRegistersInput,
      };
    },
    set_merge_program(state: GeneratorProgramViewState, action: SetMergeProgramAction)
      : GeneratorProgramViewState
    {
      return { ...state, mergeProgram: action.mergeProgramInput };
    },
    set_final_program(state: GeneratorProgramViewState, action: SetFinalProgramAction)
      : GeneratorProgramViewState
    {
      return { ...state, finalProgram: action.finalProgramInput };
    },
  },

  reducer(state: GeneratorProgramViewState, action: GeneratorProgramAction)
    : GeneratorProgramViewState
  {
    const type = action.type;
    const fn = GeneratorProgramViewState.reducers[type];
    if (!fn) {
      console.warn("GeneratorProgramViewState.reducer: Unknown action", action);
      return state;
    }
    return (fn as Reducer<GeneratorProgramViewState>)(state, action);
  },
};

type SetFormatAction = {
  type: "set_format",
  formatInput: ruleset.FormatInput,
};

type SetAddFormatWordDialogAction = {
  type: "set_add_format_word_dialog",
  dialog: AddFormatWordDialogState,
};

type SetAddFormatWordComponentDialogAction = {
  type: "set_add_format_word_component_dialog",
  dialog: AddFormatWordComponentDialogState,
};

type SetInitProgramAction = {
  type: "set_init_program",
  initProgramInput: string,
};

type SetIterationsAction = {
  type: "set_iterations",
  iterationsInput: string,
};

type SetPairwiseProgramAction = {
  type: "set_pairwise_program",
  pairwiseProgramInput: string,
};

type SetPairwiseOutputRegistersAction = {
  type: "set_pairwise_output_registers",
  pairwiseOutputRegistersInput: string,
};

type SetMergeProgramAction = {
  type: "set_merge_program",
  mergeProgramInput: string,
};

type SetFinalProgramAction = {
  type: "set_final_program",
  finalProgramInput: string,
};


type GeneratorProgramAction =
  | SetFormatAction
  | SetAddFormatWordDialogAction
  | SetAddFormatWordComponentDialogAction
  | SetInitProgramAction
  | SetIterationsAction
  | SetPairwiseProgramAction
  | SetPairwiseOutputRegistersAction
  | SetMergeProgramAction
  | SetFinalProgramAction;

export default GeneratorProgramViewState;
export type {
  AddFormatWordDialogState,
  AddFormatWordComponentDialogState,

  SetFormatAction,
  SetAddFormatWordDialogAction,
  SetAddFormatWordComponentDialogAction,
  SetInitProgramAction,
  SetIterationsAction,
  SetPairwiseProgramAction,
  SetPairwiseOutputRegistersAction,
  SetMergeProgramAction,
  SetFinalProgramAction,
  GeneratorProgramAction,
};
