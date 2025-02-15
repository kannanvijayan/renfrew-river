import { Reducer } from "@reduxjs/toolkit";

type GeneratorProgramViewState = {
  formatInput: FormatInput,
  initProgramInput: string,
  iterationsInput: string,
  pairwiseProgramInput: string,
  pairwiseOutputRegistersInput: string,
  mergeProgramInput: string,
  finalProgramInput: string,
}

type FormatInput = {
  wordFormats: WordFormatInput[],
  addWordDialog: { visible: boolean, name: string },
  addComponentDialog: {
    visible: boolean,
    name: string,
    startBit: string,
    numBits: string,
  },
};

type WordFormatInput = {
  name: string,
  components: WordComponentFormatInput[],
};

type WordComponentFormatInput = {
  name: string,
  startBit: string,
  numBits: string,
};

const GeneratorProgramViewState = {
  initialState: {
    formatInput: {
      wordFormats: [],
      addWordDialog: {
        name: "",
        visible: false,
      },
      addComponentDialog: {
        name: "",
        visible: false,
        startBit: "",
        numBits: "",
      },
    },
    initProgramInput: "",
    iterationsInput: "",
    pairwiseProgramInput: "",
    pairwiseOutputRegistersInput: "",
    mergeProgramInput: "",
    finalProgramInput: "",
  } as GeneratorProgramViewState,

  action: {
    setFormatInput(formatInput: FormatInput): SetFormatInputAction {
      return {
        type: "set_format_input" as const,
        formatInput,
      };
    },
    setInitProgramInput(initProgramInput: string): SetInitProgramInputAction {
      return {
        type: "set_init_program_input" as const,
        initProgramInput,
      };
    },
    setIterationsInput(iterationsInput: string): SetIterationsInputAction {
      return {
        type: "set_iterations_input" as const,
        iterationsInput,
      };
    },
    setPairwiseProgramInput(pairwiseProgramInput: string): SetPairwiseProgramInputAction {
      return {
        type: "set_pairwise_program_input" as const,
        pairwiseProgramInput,
      };
    },
    setPairwiseOutputRegistersInput(pairwiseOutputRegistersInput: string)
      : SetPairwiseOutputRegistersInputAction
    {
      return {
        type: "set_pairwise_output_registers_input" as const,
        pairwiseOutputRegistersInput,
      };
    },
    setMergeProgramInput(mergeProgramInput: string): SetMergeProgramInputAction {
      return {
        type: "set_merge_program_input" as const,
        mergeProgramInput,
      };
    },
    setFinalProgramInput(finalProgramInput: string): SetFinalProgramInputAction {
      return {
        type: "set_final_program_input" as const,
        finalProgramInput,
      };
    },
  },

  reducers: {
    set_format_input(state: GeneratorProgramViewState, action: SetFormatInputAction)
      : GeneratorProgramViewState
    {
      return {
        ...state,
        formatInput: action.formatInput,
      };
    },
    set_init_program_input(state: GeneratorProgramViewState, action: SetInitProgramInputAction)
      : GeneratorProgramViewState
    {
      return {
        ...state,
        initProgramInput: action.initProgramInput,
      };
    },
    set_iterations_input(state: GeneratorProgramViewState, action: SetIterationsInputAction)
      : GeneratorProgramViewState
    {
      return {
        ...state,
        iterationsInput: action.iterationsInput,
      };
    },
    set_pairwise_program_input(state: GeneratorProgramViewState, action: SetPairwiseProgramInputAction)
      : GeneratorProgramViewState
    {
      return {
        ...state,
        pairwiseProgramInput: action.pairwiseProgramInput,
      };
    },
    set_pairwise_output_registers_input(state: GeneratorProgramViewState, action: SetPairwiseOutputRegistersInputAction)
      : GeneratorProgramViewState
    {
      return {
        ...state,
        pairwiseOutputRegistersInput: action.pairwiseOutputRegistersInput,
      };
    },
    set_merge_program_input(state: GeneratorProgramViewState, action: SetMergeProgramInputAction)
      : GeneratorProgramViewState
    {
      return {
        ...state,
        mergeProgramInput: action.mergeProgramInput,
      };
    },
    set_final_program_input(state: GeneratorProgramViewState, action: SetFinalProgramInputAction)
      : GeneratorProgramViewState
    {
      return {
        ...state,
        finalProgramInput: action.finalProgramInput,
      };
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

type SetFormatInputAction = {
  type: "set_format_input",
  formatInput: FormatInput,
};

type SetInitProgramInputAction = {
  type: "set_init_program_input",
  initProgramInput: string,
};

type SetIterationsInputAction = {
  type: "set_iterations_input",
  iterationsInput: string,
};

type SetPairwiseProgramInputAction = {
  type: "set_pairwise_program_input",
  pairwiseProgramInput: string,
};

type SetPairwiseOutputRegistersInputAction = {
  type: "set_pairwise_output_registers_input",
  pairwiseOutputRegistersInput: string,
};

type SetMergeProgramInputAction = {
  type: "set_merge_program_input",
  mergeProgramInput: string,
};

type SetFinalProgramInputAction = {
  type: "set_final_program_input",
  finalProgramInput: string,
};


type GeneratorProgramAction =
  | SetFormatInputAction
  | SetInitProgramInputAction
  | SetIterationsInputAction
  | SetPairwiseProgramInputAction
  | SetPairwiseOutputRegistersInputAction
  | SetMergeProgramInputAction
  | SetFinalProgramInputAction;

export default GeneratorProgramViewState;
export type {
  FormatInput,
  WordFormatInput,
  SetFormatInputAction,
  SetInitProgramInputAction,
  SetIterationsInputAction,
  SetPairwiseProgramInputAction,
  SetPairwiseOutputRegistersInputAction,
  SetMergeProgramInputAction,
  SetFinalProgramInputAction,
  GeneratorProgramAction,
};
