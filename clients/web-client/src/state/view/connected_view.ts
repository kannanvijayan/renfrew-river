import { Reducer } from "@reduxjs/toolkit";
import {
  DefRulesEntryCategory,
  DefRulesEntrySelection,
} from "./def_rules";
import PerlinFieldsViewState, { PerlinFieldsAction } from "./perlin_fields";
import GeneratorProgramViewState, { GeneratorProgramAction } from "./generator_program";

type ConnectedViewMode =
  | "main_menu"
  | "define_ruleset";

type ConnectedViewDispatchTargets =
  | "perlin_fields"
  | "generator_program";

type ConnectedViewAction =
  | SetWsUrlAction
  | SetViewModeAction
  | SetDefRulesSelectionAction
  | SetDefRulesEntrySelectionAction
  | PerlinFieldsDispatchAction
  | GeneratorProgramDispatchAction;

type ConnectedViewState = {
  wsUrl: string,
  viewMode: ConnectedViewMode,
  defRulesSelection: DefRulesEntryCategory | null,
  defRulesEntrySelection: DefRulesEntrySelection | null,
  perlinFields: PerlinFieldsViewState,
  generatorProgram: GeneratorProgramViewState,
};

const ConnectedViewState = {
  initialState: {
    wsUrl: "",
    viewMode: "main_menu",
    defRulesSelection: null,
    defRulesEntrySelection: null,
    perlinFields: PerlinFieldsViewState.initialState,
    generatorProgram: GeneratorProgramViewState.initialState,
  } as ConnectedViewState,

  action: {
    setWsUrl(wsUrl: string): SetWsUrlAction {
      return {
        type: "set_ws_url" as const,
        wsUrl,
      };
    },
    setViewMode(viewMode: ConnectedViewMode): SetViewModeAction {
      return {
        type: "set_view_mode" as const,
        viewMode,
      };
    },
    setDefRulesSelection(defRulesSelection: DefRulesEntryCategory | null)
      : SetDefRulesSelectionAction
    {
      return {
        type: "set_def_rules_selection" as const,
        defRulesSelection,
      };
    },
    setDefRulesEntrySelection(
      defRulesEntrySelection: DefRulesEntrySelection | null
    ): SetDefRulesEntrySelectionAction {
      return {
        type: "set_def_rules_entry_selection" as const,
        defRulesEntrySelection,
      };
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
    set_ws_url(state: ConnectedViewState, action: SetWsUrlAction)
      : ConnectedViewState
    {
      return {
        ...state,
        wsUrl: action.wsUrl,
      };
    },
    set_view_mode(state: ConnectedViewState, action: SetViewModeAction)
      : ConnectedViewState
    {
      console.log("set_view_mode", action.viewMode);
      return {
        ...state,
        viewMode: action.viewMode,
      };
    },
    set_def_rules_selection(state: ConnectedViewState, action: SetDefRulesSelectionAction)
      : ConnectedViewState
    {
      return {
        ...state,
        defRulesSelection: action.defRulesSelection,
      };
    },
    set_def_rules_entry_selection(
      state: ConnectedViewState,
      action: {
        type: "set_def_rules_entry_selection",
        defRulesEntrySelection: DefRulesEntrySelection | null,
      }
    ): ConnectedViewState {
      return {
        ...state,
        defRulesEntrySelection: action.defRulesEntrySelection,
      }
    },
    perlin_fields(
      state: ConnectedViewState,
      action: PerlinFieldsDispatchAction,
    ): ConnectedViewState {
      return {
        ...state,
        perlinFields: PerlinFieldsViewState.reducer(
          state.perlinFields, action.action
        ),
      };
    },
    generator_program(
      state: ConnectedViewState,
      action: GeneratorProgramDispatchAction,
    ): ConnectedViewState {
      return {
        ...state,
        generatorProgram: GeneratorProgramViewState.reducer(
          state.generatorProgram, action.action
        ),
      };
    },
  },

  reducer(state: ConnectedViewState, action: ConnectedViewAction) 
    : ConnectedViewState
  {
    if (action.type === "dispatch") {
      const target = action.target;
      const reducer = ConnectedViewState.reducers[target];
      return (reducer as Reducer<ConnectedViewState>)(
        state,
        action as PerlinFieldsDispatchAction
      );
    }
    const fn = ConnectedViewState.reducers[action.type];
    if (!fn) {
      console.warn("ConnectedViewState.reducer: Unknown action", action);
      return state;
    }
    return (fn as Reducer<ConnectedViewState>)(state, action);
  }
};

type SetWsUrlAction = {
  type: "set_ws_url",
  wsUrl: string,
};

type SetViewModeAction = {
  type: "set_view_mode",
  viewMode: ConnectedViewMode,
};

type SetDefRulesSelectionAction = {
  type: "set_def_rules_selection",
  defRulesSelection: DefRulesEntryCategory | null,
};

type SetDefRulesEntrySelectionAction = {
  type: "set_def_rules_entry_selection",
  defRulesEntrySelection: DefRulesEntrySelection | null,
};

type TargetedConnectedViewAction<T extends ConnectedViewDispatchTargets> = {
  type: "dispatch",
  target: T,
  action: ({
    "perlin_fields": PerlinFieldsAction,
    "generator_program": GeneratorProgramAction,
  })[T],
}

type PerlinFieldsDispatchAction =
  TargetedConnectedViewAction<"perlin_fields">;

type GeneratorProgramDispatchAction =
  TargetedConnectedViewAction<"generator_program">;

export default ConnectedViewState;
export type {
  ConnectedViewAction,
  SetWsUrlAction,
  SetViewModeAction,
  SetDefRulesSelectionAction,
  SetDefRulesEntrySelectionAction,
  PerlinFieldsDispatchAction,
  GeneratorProgramDispatchAction,
  ConnectedViewMode,
};
