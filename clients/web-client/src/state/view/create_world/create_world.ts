import { Reducer } from "@reduxjs/toolkit";
import { WorldDescriptorInput } from "renfrew-river-protocol-client";

type CreateWorldViewState = {
  descriptor: WorldDescriptorInput | null,
};

const CreateWorldViewState = {
  createWorldDescriptorInput(state: CreateWorldViewState): WorldDescriptorInput {
    const descriptor = state.descriptor;
    if (!descriptor) {
      throw new Error("CreateWorldViewState.createWorldDescriptorInput: descriptor is null");
    }
    return descriptor;
  },

  initialState: {
    descriptor: null,
  } as CreateWorldViewState,

  action: {
    setDescriptor(descriptor: WorldDescriptorInput): SetDescriptorAction {
      return { type: "set_descriptor", descriptor };
    }
  },

  reducers: {
    set_descriptor(state: CreateWorldViewState, action: SetDescriptorAction)
      : CreateWorldViewState
    {
      const { descriptor } = action;
      if (state.descriptor === descriptor) {
        return state;
      }
      return { ...state, descriptor };
    }
  },

  reducer(state: CreateWorldViewState, action: CreateWorldAction): CreateWorldViewState {
    const fn = CreateWorldViewState.reducers[action.type];
    if (!fn) {
      console.warn("DefineRulesViewState.reducer: Unknown action", action);
      return state;
    }
    return (fn as Reducer<CreateWorldViewState>)(state, action);
  }
};

type SetDescriptorAction = {
  type: "set_descriptor",
  descriptor: WorldDescriptorInput,
};

type CreateWorldAction =
  | SetDescriptorAction;

export default CreateWorldViewState;
export type {
  CreateWorldAction,
  SetDescriptorAction,
};
