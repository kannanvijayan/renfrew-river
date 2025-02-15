import { Reducer } from "@reduxjs/toolkit";

type PerlinFieldsViewState = {
  seedInput: string,
  octavesInput: string,
  frequencyInput: string,
  amplitudeInput: string,
  outregInput: string,
}

const PerlinFieldsViewState = {
  initialState: {
    seedInput: "",
    octavesInput: "",
    frequencyInput: "",
    amplitudeInput: "",
    outregInput: "",
  } as PerlinFieldsViewState,

  action: {
    setSeedInput(seedInput: string): SetSeedInputAction {
      return {
        type: "set_seed_input" as const,
        seedInput,
      };
    },
    setOctavesInput(octavesInput: string): SetOctavesInputAction {
      return {
        type: "set_octaves_input" as const,
        octavesInput,
      };
    },
    setFrequencyInput(frequencyInput: string): SetFrequencyInputAction {
      return {
        type: "set_frequency_input" as const,
        frequencyInput,
      };
    },
    setAmplitudeInput(amplitudeInput: string): SetAmplitudeInputAction {
      return {
        type: "set_amplitude_input" as const,
        amplitudeInput,
      };
    },
    setOutregInput(outregInput: string): SetOutregInputAction {
      return {
        type: "set_outreg_input" as const,
        outregInput,
      };
    },
  },

  reducers: {
    set_seed_input(state: PerlinFieldsViewState, action: SetSeedInputAction)
      : PerlinFieldsViewState
    {
      return {
        ...state,
        seedInput: action.seedInput,
      };
    },
    set_octaves_input(state: PerlinFieldsViewState, action: SetOctavesInputAction)
      : PerlinFieldsViewState
    {
      return {
        ...state,
        octavesInput: action.octavesInput,
      };
    },
    set_frequency_input(state: PerlinFieldsViewState, action: SetFrequencyInputAction)
      : PerlinFieldsViewState
    {
      return {
        ...state,
        frequencyInput: action.frequencyInput,
      };
    },
    set_amplitude_input(state: PerlinFieldsViewState, action: SetAmplitudeInputAction)
      : PerlinFieldsViewState
    {
      return {
        ...state,
        amplitudeInput: action.amplitudeInput,
      };
    },
    set_outreg_input(state: PerlinFieldsViewState, action: SetOutregInputAction)
      : PerlinFieldsViewState
    {
      return {
        ...state,
        outregInput: action.outregInput,
      };
    },
  },

  reducer(state: PerlinFieldsViewState, action: PerlinFieldsAction)
    : PerlinFieldsViewState
  {
    const type = action.type;
    const fn = PerlinFieldsViewState.reducers[type];
    if (!fn) {
      console.warn("PerlinFieldsViewState.reducer: Unknown action", action);
      return state;
    }
    return (fn as Reducer<PerlinFieldsViewState>)(state, action);
  },
};

type SetSeedInputAction = {
  type: "set_seed_input",
  seedInput: string,
};

type SetOctavesInputAction = {
  type: "set_octaves_input",
  octavesInput: string,
};

type SetFrequencyInputAction = {
  type: "set_frequency_input",
  frequencyInput: string,
};

type SetAmplitudeInputAction = {
  type: "set_amplitude_input",
  amplitudeInput: string,
};

type SetOutregInputAction = {
  type: "set_outreg_input",
  outregInput: string,
};

type PerlinFieldsAction =
  | SetSeedInputAction
  | SetOctavesInputAction
  | SetFrequencyInputAction
  | SetAmplitudeInputAction
  | SetOutregInputAction;

export default PerlinFieldsViewState;
export type {
  SetSeedInputAction,
  SetOctavesInputAction,
  SetFrequencyInputAction,
  SetAmplitudeInputAction,
  SetOutregInputAction,
  PerlinFieldsAction,
};
