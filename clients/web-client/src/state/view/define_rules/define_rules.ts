import { Reducer } from "@reduxjs/toolkit";
import { RulesetValidation, RulesetInput } from "renfrew-river-protocol-client";

import {
  DefineRulesEntryCategory,
  DefineRulesEntrySelection,
} from "./ruleset";

import TerrainGenerationViewState, { TerrainGenerationAction }
  from "./terrain_generation";

type DefineRulesViewState = {
  category: DefineRulesEntryCategory | null,
  entrySelection: DefineRulesEntrySelection | null,
  updateExisting: string | null,
  name: string,
  description: string,
  terrainGeneration: TerrainGenerationViewState,
  validation: RulesetValidation | null,
};

const DefineRulesViewState = {
  fromRulesetInputAndValidation(
    ruleset: RulesetInput,
    validation: RulesetValidation | null
  ): DefineRulesViewState {
    const { name, description, terrainGen } = ruleset;
    const { perlin, stage } = terrainGen;
    return {
      category: null,
      entrySelection: null,
      updateExisting: null,
      name,
      description,
      terrainGeneration: {
        perlinFields: perlin,
        generatorProgram: {
          ...stage,
          addFormatComponentDialog: {
            visible: false,
            name: "",
            startBit: "",
            numBits: "",
          },
          addFormatWordDialog: {
            visible: false,
            name: "",
          },
        },
      },
      validation,
    };
  },

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
    updateExisting: null,
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
    setRuleset(ruleset: RulesetInput): SetRulesetAction {
      return { type: "set_ruleset" as const, ruleset };
    },
    setName(name: string): SetNameAction {
      return { type: "set_name" as const, name };
    },
    setDescription(description: string): SetDescriptionAction {
      return { type: "set_description" as const, description };
    },
    setUpdateExisting(updateExisting: string | null): SetUpdateExistingAction {
      return { type: "set_update_existing" as const, updateExisting };
    },
    setValidation(validation: RulesetValidation | null)
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
      const { category } = action;
      if (state.category === category) {
        return state;
      }
      return { ...state, category };
    },
    set_entry_selection(
      state: DefineRulesViewState,
      action: SetEntrySelectionAction
    ): DefineRulesViewState {
      const { entrySelection } = action;
      if (state.entrySelection === entrySelection) {
        return state;
      }
      return { ...state, entrySelection };
    },
    set_ruleset(state: DefineRulesViewState, action: SetRulesetAction)
      : DefineRulesViewState
    {
      const { ruleset } = action;
      const { name, description, terrainGen } = ruleset;
      const { perlin, stage } = terrainGen;
      return {
        ...state,
        name,
        description,
        terrainGeneration: {
          perlinFields: perlin,
          generatorProgram: {
            ...stage,
            addFormatComponentDialog: {
              visible: false,
              name: "",
              startBit: "",
              numBits: "",
            },
            addFormatWordDialog: {
              visible: false,
              name: "",
            },
          },
        }
      };
    },
    set_name(state: DefineRulesViewState, action: SetNameAction)
      : DefineRulesViewState
    {
      const { name } = action;
      if (state.name === name) {
        return state;
      }
      return { ...state, name };
    },
    set_description(state: DefineRulesViewState, action: SetDescriptionAction)
      : DefineRulesViewState
    {
      const { description } = action;
      if (state.description === description) {
        return state;
      }
      return { ...state, description };
    },
    set_update_existing(
      state: DefineRulesViewState,
      action: SetUpdateExistingAction
    ): DefineRulesViewState {
      const { updateExisting } = action;
      if (state.updateExisting === updateExisting) {
        return state;
      }
      return { ...state, updateExisting };
    },
    set_validation(state: DefineRulesViewState, action: SetValidationAction)
      : DefineRulesViewState
    {
      const { validation } = action;
      if (state.validation === validation) {
        return state;
      }
      return { ...state, validation };
    },
    terrain_generation(
      state: DefineRulesViewState,
      action: TerrainGenerationDispatchAction
    ): DefineRulesViewState {
      const terrainGeneration = TerrainGenerationViewState.reducer(
        state.terrainGeneration, action.action
      );
      if (terrainGeneration === state.terrainGeneration) {
        return state;
      }
      return { ...state, terrainGeneration };
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

type SetRulesetAction = {
  type: "set_ruleset",
  ruleset: RulesetInput,
};

type SetNameAction = {
  type: "set_name",
  name: string,
};

type SetDescriptionAction = {
  type: "set_description",
  description: string,
};

type SetUpdateExistingAction = {
  type: "set_update_existing",
  updateExisting: string | null,
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
  | SetRulesetAction
  | SetNameAction
  | SetDescriptionAction
  | SetUpdateExistingAction
  | SetValidationAction
  | TerrainGenerationDispatchAction

export default DefineRulesViewState;
export type {
  DefineRulesAction,
  SetCategoryAction,
  SetEntrySelectionAction,
  SetRulesetAction,
  SetNameAction,
  SetDescriptionAction,
  SetUpdateExistingAction,
  SetValidationAction,
  TerrainGenerationDispatchAction,
};
