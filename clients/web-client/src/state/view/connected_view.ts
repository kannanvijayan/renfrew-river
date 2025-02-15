import { Reducer } from "@reduxjs/toolkit";
import DefRulesViewState, { DefRulesAction } from "./def_rules";

type ConnectedViewMode =
  | "main_menu"
  | "define_ruleset";

type ConnectedViewDispatchTargets =
  | "def_rules";

type ConnectedViewAction =
  | SetWsUrlAction
  | SetViewModeAction
  | SetDefRulesAction
  | DefRulesDispatchAction

type ConnectedViewState = {
  wsUrl: string,
  viewMode: ConnectedViewMode,
  defRules: DefRulesViewState | null,
};

const ConnectedViewState = {
  initialState: {
    wsUrl: "",
    viewMode: "main_menu",
    defRules: null,
  } as ConnectedViewState,

  action: {
    setWsUrl(wsUrl: string): SetWsUrlAction {
      return {
        type: "set_ws_url" as const,
        wsUrl,
      };
    },
    setViewMode(viewMode: ConnectedViewMode): SetViewModeAction {
      return { type: "set_view_mode" as const, viewMode };
    },
    setDefRules(defRules: DefRulesViewState): SetDefRulesAction {
      return { type: "set_def_rules" as const, defRules };
    },
    defRules(action: DefRulesAction): DefRulesDispatchAction {
      return { type: "dispatch" as const, target: "def_rules", action };
    },
  },

  reducers: {
    set_ws_url(state: ConnectedViewState, action: SetWsUrlAction)
      : ConnectedViewState
    {
      return { ...state, wsUrl: action.wsUrl };
    },
    set_view_mode(state: ConnectedViewState, action: SetViewModeAction)
      : ConnectedViewState
    {
      return { ...state, viewMode: action.viewMode };
    },
    set_def_rules(state: ConnectedViewState, action: SetDefRulesAction)
      : ConnectedViewState
    {
      return { ...state, defRules: action.defRules };
    },
    def_rules(
      state: ConnectedViewState,
      action: DefRulesDispatchAction,
    ): ConnectedViewState {
      const defRules = state.defRules;
      if (!defRules) {
        console.warn("ConnectedViewState.reducer: defRules is null");
        return state;
      }
      return {
        ...state,
        defRules: DefRulesViewState.reducer(defRules, action.action),
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
        action as DefRulesDispatchAction
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

type SetDefRulesAction = {
  type: "set_def_rules",
  defRules: DefRulesViewState,
};

type TargetedConnectedViewAction<T extends ConnectedViewDispatchTargets> = {
  type: "dispatch",
  target: T,
  action: ({
    "def_rules": DefRulesAction,
  })[T],
}

type DefRulesDispatchAction =
  TargetedConnectedViewAction<"def_rules">;

export default ConnectedViewState;
export type {
  ConnectedViewAction,
  SetWsUrlAction,
  SetViewModeAction,
  DefRulesDispatchAction,
  ConnectedViewMode,
};
