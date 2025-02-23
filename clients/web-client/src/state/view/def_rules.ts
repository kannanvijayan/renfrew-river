import { Reducer } from "@reduxjs/toolkit";
import { ruleset } from "renfrew-river-protocol-client";

import {
  DefineRulesEntryCategory,
  DefineRulesEntrySelection,
} from "./def_rules/ruleset";

import TerrainGenerationViewState, { TerrainGenerationAction }
  from "./def_rules/terrain_generation";

type DefineRulesViewState = {
  category: DefineRulesEntryCategory | null,
  entrySelection: DefineRulesEntrySelection | null,
  terrainGeneration: TerrainGenerationViewState,
  validation: ruleset.RulesetValidation | null,
};

const DefineRulesViewState = {
  createRulesetInput(state: DefineRulesViewState): ruleset.RulesetInput {
    return {
      name: "",
      description: "",
      terrainGen: {
        perlin: state.terrainGeneration.perlinFields,
        stage: state.terrainGeneration.generatorProgram,
      }
    };
  },

  initialState: {
    category: null,
    entrySelection: null,
    terrainGeneration: TerrainGenerationViewState.initialState,
    validation: null,
  } as DefineRulesViewState,

  action: {
    setCategory(category: DefineRulesEntryCategory | null)
      : SetCategoryAction
    {
      return { type: "set_category" as const, category };
    },
    setEntrySelection(entrySelection: DefineRulesEntrySelection | null)
      : SetEntrySelectionAction
    {
      return { type: "set_entry_selection" as const, entrySelection };
    },
    setValidation(validation: ruleset.RulesetValidation | null)
      : SetValidationAction
    {
      return { type: "set_validation" as const, validation };
    },
    terrainGeneration(action: TerrainGenerationAction)
      : TerrainGenerationDispatchAction
    {
      return { type: "dispatch" as const, target: "terrain_generation", action };
    }
  },

  reducers: {
    set_category(state: DefineRulesViewState, action: SetCategoryAction)
      : DefineRulesViewState
    {
      return { ...state, category: action.category };
    },
    set_entry_selection(
      state: DefineRulesViewState,
      action: SetEntrySelectionAction
    ): DefineRulesViewState {
      return { ...state, entrySelection: action.entrySelection }
    },
    set_validation(state: DefineRulesViewState, action: SetValidationAction)
      : DefineRulesViewState
    {
      return { ...state, validation: action.validation };
    },
    terrain_generation(
      state: DefineRulesViewState,
      action: TerrainGenerationDispatchAction
    ): DefineRulesViewState {
      return {
        ...state,
        terrainGeneration: TerrainGenerationViewState.reducer(
          state.terrainGeneration, action.action
        ),
      };
    },
  },

  reducer(state: DefineRulesViewState, action: DefineRulesAction): DefineRulesViewState {
    if (action.type === "dispatch") {
      const target = action.target;
      const reducer = DefineRulesViewState.reducers[target];
      return (reducer as Reducer<DefineRulesViewState>)(
        state,
        action as TerrainGenerationDispatchAction
      );
    }
    const fn = DefineRulesViewState.reducers[action.type];
    if (!fn) {
      console.warn("DefineRulesViewState.reducer: Unknown action", action);
      return state;
    }
    return (fn as Reducer<DefineRulesViewState>)(state, action);
  }
};

type SetCategoryAction = {
  type: "set_category",
  category: DefineRulesEntryCategory | null,
};

type SetEntrySelectionAction = {
  type: "set_entry_selection",
  entrySelection: DefineRulesEntrySelection | null,
};

type SetValidationAction = {
  type: "set_validation",
  validation: ruleset.RulesetValidation | null,
};

type TargetedDefineRulesAction<T extends DefineRulesDispatchTargets> = {
  type: "dispatch",
  target: T,
  action: ({
    "terrain_generation": TerrainGenerationAction,
  })[T],
}

type TerrainGenerationDispatchAction =
  TargetedDefineRulesAction<"terrain_generation">;

type DefineRulesDispatchTargets =
  | "terrain_generation";

type DefineRulesAction =
  | SetCategoryAction
  | SetEntrySelectionAction
  | SetValidationAction
  | TerrainGenerationDispatchAction

export default DefineRulesViewState;
export type {
  DefineRulesAction,
  SetCategoryAction,
  SetEntrySelectionAction,
  SetValidationAction,
  TerrainGenerationDispatchAction,
};
