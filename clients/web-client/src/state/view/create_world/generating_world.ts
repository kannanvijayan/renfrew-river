import { Reducer } from "@reduxjs/toolkit";
import { GenerationPhase, WorldDescriptor } from "renfrew-river-protocol-client";

type GeneratingWorldViewState = {
  descriptor: WorldDescriptor,
  phase: GenerationPhase,
}

const GeneratingWorldViewState = {
  get initialState() { throw new Error("initialState is not defined"); },

  action: {
    setDescriptor(descriptor: WorldDescriptor): SetDescriptorAction {
      return { type: "set_descriptor", descriptor };
    },
    setPhase(phase: GenerationPhase): SetPhaseAction {
      return { type: "set_phase", phase };
    },
  },

  reducers: {
    set_descriptor(state: GeneratingWorldViewState, action: SetDescriptorAction)
      : GeneratingWorldViewState
    {
      const { descriptor } = action;
      if (state.descriptor === descriptor) {
        return state;
      }
      return { ...state, descriptor };
    },
    set_phase(state: GeneratingWorldViewState, action: SetPhaseAction)
      : GeneratingWorldViewState
    {
      const { phase } = action;
      if (state.phase === phase) {
        return state;
      }
      return { ...state, phase };
    },
  },

  reducer(state: GeneratingWorldViewState, action: GeneratingWorldAction)
    : GeneratingWorldViewState
  {
    const fn = GeneratingWorldViewState.reducers[action.type];
    if (!fn) {
      console.warn("DefineRulesViewState.reducer: Unknown action", action);
      return state;
    }
    return (fn as Reducer<GeneratingWorldViewState>)(state, action);
  }
};

type SetDescriptorAction = {
  type: "set_descriptor",
  descriptor: WorldDescriptor,
};

type SetPhaseAction = {
  type: "set_phase",
  phase: GenerationPhase,
};

type GeneratingWorldAction =
  | SetDescriptorAction
  | SetPhaseAction;

export default GeneratingWorldViewState;
export type {
  GeneratingWorldAction,

  SetDescriptorAction,
  SetPhaseAction,
};
