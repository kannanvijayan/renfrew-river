import { Reducer } from "@reduxjs/toolkit";
import { RulesetValidation, RulesetInput } from "renfrew-river-protocol-client";

import {
  DefineRulesEntryCategory,
  DefineRulesEntrySelection,
} from "./define_rules/ruleset";

import TerrainGenerationViewState, { TerrainGenerationAction }
  from "./define_rules/terrain_generation";

type DefineRulesViewState = {
  category: DefineRulesEntryCategory | null,
  entrySelection: DefineRulesEntrySelection | null,
  name: string,
  description: string,
  terrainGeneration: TerrainGenerationViewState,
  validation: RulesetValidation | null,
};

const DefineRulesViewState = {
  createRulesetInput(state: DefineRulesViewState): RulesetInput {
    const { name, description, terrainGeneration } = state;
    return {
      name,
      description,
      terrainGen: {
        perlin: terrainGeneration.perlinFields,
        stage: terrainGeneration.generatorProgram,
      }
    };
  },

  initialState: {
    category: null,
    entrySelection: null,
    name: "",
    description: "",
    terrainGeneration: TerrainGenerationViewState.initialState,
    validation: null,
  } as DefineRulesViewState,

  action: {
    setCategory(category: DefineRulesEntryCategory | null)
      : SetCategoryAction {
      return { type: "set_category" as const, category };
    },
    setEntrySelection(entrySelection: DefineRulesEntrySelection | null)
      : SetEntrySelectionAction {
      return { type: "set_entry_selection" as const, entrySelection };
    },
    setName(name: string): SetNameAction {
      return { type: "set_name" as const, name };
    },
    setDescription(description: string): SetDescriptionAction {
      return { type: "set_description" as const, description };
    },
    setValidation(validation: RulesetValidation | null)
      : SetValidationAction {
      return { type: "set_validation" as const, validation };
    },
    terrainGeneration(action: TerrainGenerationAction)
      : TerrainGenerationDispatchAction {
      return { type: "dispatch" as const, target: "terrain_generation", action };
    }
  },

  reducers: {
    set_category(state: DefineRulesViewState, action: SetCategoryAction)
      : DefineRulesViewState {
      return { ...state, category: action.category };
    },
    set_entry_selection(
      state: DefineRulesViewState,
      action: SetEntrySelectionAction
    ): DefineRulesViewState {
      return { ...state, entrySelection: action.entrySelection }
    },
    set_name(state: DefineRulesViewState, action: SetNameAction)
      : DefineRulesViewState {
      return { ...state, name: action.name };
    },
    set_description(state: DefineRulesViewState, action: SetDescriptionAction)
      : DefineRulesViewState {
      return { ...state, description: action.description };
    },
    set_validation(state: DefineRulesViewState, action: SetValidationAction)
      : DefineRulesViewState {
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

type SetNameAction = {
  type: "set_name",
  name: string,
};

type SetDescriptionAction = {
  type: "set_description",
  description: string,
};

type SetValidationAction = {
  type: "set_validation",
  validation: RulesetValidation | null,
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
  | SetNameAction
  | SetDescriptionAction
  | SetValidationAction
  | TerrainGenerationDispatchAction

export default DefineRulesViewState;
export type {
  DefineRulesAction,
  SetCategoryAction,
  SetEntrySelectionAction,
  SetNameAction,
  SetDescriptionAction,
  SetValidationAction,
  TerrainGenerationDispatchAction,
};
