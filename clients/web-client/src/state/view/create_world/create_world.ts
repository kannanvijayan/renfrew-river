import { Reducer } from "@reduxjs/toolkit";
import {
  WorldDescriptorInput,
  WorldDescriptorValidation,
} from "renfrew-river-protocol-client";

type CreateWorldViewState =
  | { SpecifyDescriptor: SpecifyDescriptorViewState }
  | { GeneratingWorld: GeneratingWorldViewState };

type SpecifyDescriptorViewState = {
  descriptor: WorldDescriptorInput | null,
  validation: WorldDescriptorValidation | null,
};

type GeneratingWorldViewState = null;

const CreateWorldViewState = {
  initialState: {
    SpecifyDescriptor: {
      descriptor: null,
      validation: null,
    },
  } as CreateWorldViewState,

  action: {
    setDescriptor(descriptor: WorldDescriptorInput | null)
      : SetDescriptorAction
    {
      return { type: "set_descriptor", descriptor };
    },
    setValidation(validation: WorldDescriptorValidation | null)
      : SetValidationAction
    {
      return { type: "set_validation", validation };
    }
  },

  reducers: {
    set_descriptor(state: CreateWorldViewState, action: SetDescriptorAction)
      : CreateWorldViewState
    {
      const { descriptor } = action;
      if (!("SpecifyDescriptor" in state)) {
        return state;
      }
      if (state.SpecifyDescriptor.descriptor === descriptor) {
        return state;
      }
      return { SpecifyDescriptor: { ...state.SpecifyDescriptor, descriptor } };
    },
    set_validation(state: CreateWorldViewState, action: SetValidationAction)
      : CreateWorldViewState
    {
      const { validation } = action;
      if (!("SpecifyDescriptor" in state)) {
        return state;
      }
      if (state.SpecifyDescriptor.validation === validation) {
        return state;
      }
      return { SpecifyDescriptor: { ...state.SpecifyDescriptor, validation } };
    },
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
  descriptor: WorldDescriptorInput | null,
};

type SetValidationAction = {
  type: "set_validation",
  validation: WorldDescriptorValidation | null,
};

type CreateWorldAction =
  | SetDescriptorAction
  | SetValidationAction;

export default CreateWorldViewState;
export type {
  SpecifyDescriptorViewState,
  GeneratingWorldViewState,

  CreateWorldAction,
  SetDescriptorAction,
};
