import { Reducer } from "@reduxjs/toolkit";
import PerlinFieldsViewState, { PerlinFieldsAction } from "./perlin_fields";
import GeneratorProgramViewState, { GeneratorProgramAction } from "./generator_program";

type TerrainGenerationViewState = {
  perlinFields: PerlinFieldsViewState,
  generatorProgram: GeneratorProgramViewState,
}

const TerrainGenerationViewState = {
  initialState: {
    perlinFields: PerlinFieldsViewState.initialState,
    generatorProgram: GeneratorProgramViewState.initialState,
  } as TerrainGenerationViewState,

  action: {
    perlinFields(action: PerlinFieldsAction): PerlinFieldsDispatchAction {
      return { type: "dispatch", target: "perlin_fields", action };
    },

    generatorProgram(action: GeneratorProgramAction)
      : GeneratorProgramDispatchAction
    {
      return { type: "dispatch", target: "generator_program", action };
    },
  },

  reducers: {
    perlin_fields(state: TerrainGenerationViewState, action: PerlinFieldsDispatchAction)
      : TerrainGenerationViewState
    {
      const perlinFields =
        PerlinFieldsViewState.reducer(state.perlinFields, action.action);
      return { ...state, perlinFields };
    },

    generator_program(
      state: TerrainGenerationViewState,
      action: GeneratorProgramDispatchAction
    ): TerrainGenerationViewState {
      return {
        ...state,
        generatorProgram:
          GeneratorProgramViewState.reducer(state.generatorProgram, action.action),
      };
    },
  },

  reducer(state: TerrainGenerationViewState, action: TerrainGenerationAction)
    : TerrainGenerationViewState
  {
    if (action.type === "dispatch") {
      const target = action.target;
      const reducer = TerrainGenerationViewState.reducers[target];
      return (reducer as Reducer<TerrainGenerationViewState>)(
        state,
        action as PerlinFieldsDispatchAction
      );
    }
    return state;
  },
};

type PerlinFieldsDispatchAction = {
  type: "dispatch",
  target: "perlin_fields",
  action: PerlinFieldsAction,
};

type GeneratorProgramDispatchAction = {
  type: "dispatch",
  target: "generator_program",
  action: GeneratorProgramAction,
};

type TerrainGenerationDispatchTargets =
  | "perlin_fields"
  | "generator_program";

type TerrainGenerationAction =
  | PerlinFieldsDispatchAction
  | GeneratorProgramDispatchAction;

export default TerrainGenerationViewState;
export type {
  TerrainGenerationViewState,
  PerlinFieldsDispatchAction,
  GeneratorProgramDispatchAction,
  TerrainGenerationDispatchTargets,
  TerrainGenerationAction,
};
