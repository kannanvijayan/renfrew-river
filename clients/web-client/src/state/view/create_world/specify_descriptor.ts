import { Reducer } from "@reduxjs/toolkit";
import {
  WorldDescriptor,
  WorldDescriptorInput,
  WorldDescriptorValidation,
} from "renfrew-river-protocol-client";

type SpecifyDescriptorViewState = {
  descriptor: WorldDescriptorInput | null,
  validation: WorldDescriptorValidation | null,
  validatedDescriptor: WorldDescriptor | null,
};

const SpecifyDescriptorViewState = {
  initialState: {
    descriptor: null,
    validation: null,
    validatedDescriptor: null,
  } as SpecifyDescriptorViewState,

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
    },
    setValidatedDescriptor(validatedDescriptor: WorldDescriptor | null)
      : SetValidatedDescriptorAction
    {
      return { type: "set_validated_descriptor", validatedDescriptor };
    }
  },

  reducers: {
    set_descriptor(state: SpecifyDescriptorViewState, action: SetDescriptorAction)
      : SpecifyDescriptorViewState
    {
      const { descriptor } = action;
      if (state.descriptor === descriptor) {
        return state;
      }
      return { ...state, descriptor };
    },
    set_validation(state: SpecifyDescriptorViewState, action: SetValidationAction)
      : SpecifyDescriptorViewState
    {
      const { validation } = action;
      if (state.validation === validation) {
        return state;
      }
      return { ...state, validation };
    },
    set_validated_descriptor(
      state: SpecifyDescriptorViewState,
      action: SetValidatedDescriptorAction
    ): SpecifyDescriptorViewState {
      const { validatedDescriptor } = action;
      if (state.validatedDescriptor === validatedDescriptor) {
        return state;
      }
      return { ...state, validatedDescriptor };
    },
  },

  reducer(state: SpecifyDescriptorViewState, action: SpecifyDescriptorAction)
    : SpecifyDescriptorViewState
  {
    const fn = SpecifyDescriptorViewState.reducers[action.type];
    if (!fn) {
      console.warn("DefineRulesViewState.reducer: Unknown action", action);
      return state;
    }
    return (fn as Reducer<SpecifyDescriptorViewState>)(state, action);
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

type SetValidatedDescriptorAction = {
  type: "set_validated_descriptor",
  validatedDescriptor: WorldDescriptor | null,
};

type SpecifyDescriptorAction =
  | SetDescriptorAction
  | SetValidationAction
  | SetValidatedDescriptorAction;


export default SpecifyDescriptorViewState;
export type {
  SpecifyDescriptorAction,

  SetDescriptorAction,
  SetValidationAction,
  SetValidatedDescriptorAction,
};
