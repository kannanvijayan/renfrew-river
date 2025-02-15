import { Reducer } from "@reduxjs/toolkit";
import {
  DefRulesEntryCategory,
  DefRulesEntrySelection,
} from "./def_rules/ruleset";
import PerlinFieldsViewState, { PerlinFieldsAction } from "./def_rules/perlin_fields";
import GeneratorProgramViewState, { GeneratorProgramAction } from "./def_rules/generator_program";

type DefRulesDispatchTargets =
  | "perlin_fields"
  | "generator_program";

type DefRulesAction =
  | SetDefRulesCategoryAction
  | SetDefRulesEntrySelectionAction
  | PerlinFieldsDispatchAction
  | GeneratorProgramDispatchAction;

type DefRulesViewState = {
  category: DefRulesEntryCategory | null,
  entrySelection: DefRulesEntrySelection | null,
  perlinFields: PerlinFieldsViewState,
  generatorProgram: GeneratorProgramViewState,
};

const DefRulesViewState = {
  initialState: {
    category: null,
    entrySelection: null,
    perlinFields: PerlinFieldsViewState.initialState,
    generatorProgram: GeneratorProgramViewState.initialState,
  } as DefRulesViewState,

  action: {
    setCategory(category: DefRulesEntryCategory | null)
      : SetDefRulesCategoryAction
    {
      return { type: "set_category" as const, category };
    },
    setEntrySelection(entrySelection: DefRulesEntrySelection | null)
      : SetDefRulesEntrySelectionAction
    {
      return { type: "set_entry_selection" as const, entrySelection };
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
    set_category(state: DefRulesViewState, action: SetDefRulesCategoryAction)
      : DefRulesViewState
    {
      return { ...state, category: action.category };
    },
    set_entry_selection(
      state: DefRulesViewState,
      action: SetDefRulesEntrySelectionAction
    ): DefRulesViewState {
      return { ...state, entrySelection: action.entrySelection }
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

type SetDefRulesCategoryAction = {
  type: "set_category",
  category: DefRulesEntryCategory | null,
};

type SetDefRulesEntrySelectionAction = {
  type: "set_entry_selection",
  entrySelection: DefRulesEntrySelection | null,
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
  SetDefRulesCategoryAction,
  SetDefRulesEntrySelectionAction,
  PerlinFieldsDispatchAction,
  GeneratorProgramDispatchAction,
};
