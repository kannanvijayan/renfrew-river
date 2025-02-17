import { Reducer } from "@reduxjs/toolkit";
import { ruleset } from "renfrew-river-protocol-client";

import {
  DefRulesEntryCategory,
  DefRulesEntrySelection,
} from "./def_rules/ruleset";

import PerlinFieldsViewState, {
  PerlinFieldsAction,
} from "./def_rules/perlin_fields";

import GeneratorProgramViewState, {
  GeneratorProgramAction,
} from "./def_rules/generator_program";

type DefRulesDispatchTargets =
  | "perlin_fields"
  | "generator_program";

type DefRulesAction =
  | SetCategoryAction
  | SetEntrySelectionAction
  | SetValidationAction
  | PerlinFieldsDispatchAction
  | GeneratorProgramDispatchAction;

type DefRulesViewState = {
  category: DefRulesEntryCategory | null,
  entrySelection: DefRulesEntrySelection | null,
  perlinFields: PerlinFieldsViewState,
  generatorProgram: GeneratorProgramViewState,
  validation: ruleset.RulesetValidation | null,
};

const DefRulesViewState = {
  createRulesetInput(state: DefRulesViewState): ruleset.RulesetInput {
    return {
      name: "",
      description: "",
      terrainGen: {
        perlin: state.perlinFields,
        stage: state.generatorProgram,
      },
    };
  },

  initialState: {
    category: null,
    entrySelection: null,
    perlinFields: PerlinFieldsViewState.initialState,
    generatorProgram: GeneratorProgramViewState.initialState,
    validation: null,
  } as DefRulesViewState,

  action: {
    setCategory(category: DefRulesEntryCategory | null)
      : SetCategoryAction
    {
      return { type: "set_category" as const, category };
    },
    setEntrySelection(entrySelection: DefRulesEntrySelection | null)
      : SetEntrySelectionAction
    {
      return { type: "set_entry_selection" as const, entrySelection };
    },
    setValidation(validation: ruleset.RulesetValidation | null)
      : SetValidationAction
    {
      return { type: "set_validation" as const, validation };
    },
    perlinFields(action: PerlinFieldsAction): PerlinFieldsDispatchAction {
      return {
        type: "dispatch" as const,
        target: "perlin_fields",
        action,
      };
    },
    generatorProgram(action: GeneratorProgramAction)
      : GeneratorProgramDispatchAction
    {
      return {
        type: "dispatch" as const,
        target: "generator_program",
        action,
      };
    }
  },

  reducers: {
    set_category(state: DefRulesViewState, action: SetCategoryAction)
      : DefRulesViewState
    {
      return { ...state, category: action.category };
    },
    set_entry_selection(
      state: DefRulesViewState,
      action: SetEntrySelectionAction
    ): DefRulesViewState {
      return { ...state, entrySelection: action.entrySelection }
    },
    set_validation(state: DefRulesViewState, action: SetValidationAction)
      : DefRulesViewState
    {
      return { ...state, validation: action.validation };
    },
    perlin_fields(
      state: DefRulesViewState,
      action: PerlinFieldsDispatchAction,
    ): DefRulesViewState {
      return {
        ...state,
        perlinFields: PerlinFieldsViewState.reducer(
          state.perlinFields, action.action
        ),
      };
    },
    generator_program(
      state: DefRulesViewState,
      action: GeneratorProgramDispatchAction,
    ): DefRulesViewState {
      return {
        ...state,
        generatorProgram: GeneratorProgramViewState.reducer(
          state.generatorProgram, action.action
        ),
      };
    },
  },

  reducer(state: DefRulesViewState, action: DefRulesAction): DefRulesViewState {
    if (action.type === "dispatch") {
      const target = action.target;
      const reducer = DefRulesViewState.reducers[target];
      return (reducer as Reducer<DefRulesViewState>)(
        state,
        action as PerlinFieldsDispatchAction
      );
    }
    const fn = DefRulesViewState.reducers[action.type];
    if (!fn) {
      console.warn("DefRulesViewState.reducer: Unknown action", action);
      return state;
    }
    return (fn as Reducer<DefRulesViewState>)(state, action);
  }
};

type SetCategoryAction = {
  type: "set_category",
  category: DefRulesEntryCategory | null,
};

type SetEntrySelectionAction = {
  type: "set_entry_selection",
  entrySelection: DefRulesEntrySelection | null,
};

type SetValidationAction = {
  type: "set_validation",
  validation: ruleset.RulesetValidation | null,
};

type TargetedDefRulesAction<T extends DefRulesDispatchTargets> = {
  type: "dispatch",
  target: T,
  action: ({
    "perlin_fields": PerlinFieldsAction,
    "generator_program": GeneratorProgramAction,
  })[T],
}

type PerlinFieldsDispatchAction =
  TargetedDefRulesAction<"perlin_fields">;

type GeneratorProgramDispatchAction =
  TargetedDefRulesAction<"generator_program">;

export default DefRulesViewState;
export type {
  DefRulesAction,
  SetCategoryAction,
  SetEntrySelectionAction,
  SetValidationAction,
  PerlinFieldsDispatchAction,
  GeneratorProgramDispatchAction,
};
