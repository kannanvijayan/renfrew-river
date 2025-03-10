import { Reducer } from "@reduxjs/toolkit";
import {
  WorldDescriptor,
  WorldDescriptorInput,
  WorldDescriptorValidation,
} from "renfrew-river-protocol-client";
import SpecifyDescriptorViewState, {
  SpecifyDescriptorAction
} from "./specify_descriptor";
import GeneratingWorldViewState, { GeneratingWorldAction } from "./generating_world";

type CreateWorldViewState =
  | { SpecifyDescriptor: SpecifyDescriptorViewState }
  | { GeneratingWorld: GeneratingWorldViewState };

const CreateWorldViewState = {
  initialState: {
    SpecifyDescriptor: {
      descriptor: null,
      validation: null,
      validatedDescriptor: null,
    },
  } as CreateWorldViewState,

  action: {
    specifyDescriptor(action: SpecifyDescriptorAction): SpecifyDescriptorDispatchAction {
      return {
        type: "dispatch",
        target: "specify_descriptor",
        action,
      };
    },
    generatingWorld(action: GeneratingWorldAction): GeneratingWorldDispatchAction {
      return {
        type: "dispatch",
        target: "generating_world",
        action,
      };
    },
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
    set_validated_descriptor(
      state: CreateWorldViewState,
      action: SetValidatedDescriptorAction
    ): CreateWorldViewState {
      const { validatedDescriptor } = action;
      if (!("SpecifyDescriptor" in state)) {
        return state;
      }
      if (state.SpecifyDescriptor.validatedDescriptor === validatedDescriptor) {
        return state;
      }
      return {
        SpecifyDescriptor: { ...state.SpecifyDescriptor, validatedDescriptor },
      };
    },
    specify_descriptor(
      state: CreateWorldViewState,
      action: SpecifyDescriptorDispatchAction
    ): CreateWorldViewState {
      if (!("SpecifyDescriptor" in state)) {
        return state;
      }
      const specifyDescriptor = SpecifyDescriptorViewState.reducer(
        state.SpecifyDescriptor, action.action
      );
      if (specifyDescriptor === state.SpecifyDescriptor) {
        return state;
      }
      return { SpecifyDescriptor: specifyDescriptor };
    },
    generating_world(
      state: CreateWorldViewState,
      action: GeneratingWorldDispatchAction
    ): CreateWorldViewState {
      if (!("GeneratingWorld" in state)) {
        return state;
      }
      const generatingWorld = GeneratingWorldViewState.reducer(
        state.GeneratingWorld, action.action
      );
      if (generatingWorld === state.GeneratingWorld) {
        return state;
      }
      return { GeneratingWorld: generatingWorld };
    },
  },

  reducer(state: CreateWorldViewState, action: CreateWorldAction): CreateWorldViewState {
    if (action.type === "dispatch") {
      const target = action.target;
      const reducer = CreateWorldViewState.reducers[target];
      return (reducer as Reducer<CreateWorldViewState>)(
        state,
        action as TargetedDefineRulesAction<CreateWorldDispatchTargets>
      );
    }
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

type SetValidatedDescriptorAction = {
  type: "set_validated_descriptor",
  validatedDescriptor: WorldDescriptor | null,
};

type CreateWorldDispatchTargets =
  | "specify_descriptor"
  | "generating_world";

type TargetedDefineRulesAction<T extends CreateWorldDispatchTargets> = {
  type: "dispatch",
  target: T,
  action: ({
    "specify_descriptor": SpecifyDescriptorAction,
    "generating_world": GeneratingWorldAction,
  })[T],
}

type SpecifyDescriptorDispatchAction =
  TargetedDefineRulesAction<"specify_descriptor">;

type GeneratingWorldDispatchAction =
  TargetedDefineRulesAction<"generating_world">;

type CreateWorldAction =
  | SetDescriptorAction
  | SetValidationAction
  | SetValidatedDescriptorAction
  | SpecifyDescriptorDispatchAction
  | GeneratingWorldDispatchAction;

export default CreateWorldViewState;
export type {
  CreateWorldAction,
  SetDescriptorAction,
  SetValidationAction,
  SetValidatedDescriptorAction,

  SpecifyDescriptorDispatchAction,
  GeneratingWorldDispatchAction,
};
