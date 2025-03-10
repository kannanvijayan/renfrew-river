import { Reducer } from "@reduxjs/toolkit";
import { WorldDescriptor } from "renfrew-river-protocol-client";

type GeneratingWorldViewState = {
  descriptor: WorldDescriptor,
}

const GeneratingWorldViewState = {
  get initialState() { throw new Error("initialState is not defined"); },

  action: {
    setDescriptor(descriptor: WorldDescriptor): SetDescriptorAction {
      return { type: "set_descriptor", descriptor };
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

type GeneratingWorldAction =
  | SetDescriptorAction;

export default GeneratingWorldViewState;
export type {
  GeneratingWorldAction,

  SetDescriptorAction,
};
