import { Reducer } from "@reduxjs/toolkit";
import DefineRulesViewState, { DefineRulesAction } from "./define_rules";

type ConnectedViewMode =
  | "main_menu"
  | "define_rules"
  | "create_world"
  | "pick_ruleset_to_edit"
  | "pick_ruleset_for_create_world";

const ConnectedViewMode = {
  MAIN_MENU: "main_menu" as const,
  DEFINE_RULES: "define_rules" as const,
  CREATE_WORLD: "create_world" as const,
  PICK_RULESET_TO_EDIT: "pick_ruleset_to_edit" as const,
  PICK_RULESET_FOR_CREATE_WORLD: "pick_ruleset_for_create_world" as const,
}

type ConnectedViewDispatchTargets =
  | "define_rules";

type ConnectedViewAction =
  | SetWsUrlAction
  | SetViewModeAction
  | SetDefineRulesAction
  | DefineRulesDispatchAction

type ConnectedViewState = {
  wsUrl: string,
  viewMode: ConnectedViewMode,
  defineRules: DefineRulesViewState | null,
};

const ConnectedViewState = {
  initialState: {
    wsUrl: "",
    viewMode: "main_menu",
    defineRules: null,
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
    setDefineRules(defineRules: DefineRulesViewState): SetDefineRulesAction {
      return { type: "set_define_rules" as const, defineRules };
    },
    defineRules(action: DefineRulesAction): DefineRulesDispatchAction {
      return { type: "dispatch" as const, target: "define_rules", action };
    },
  },

  reducers: {
    set_ws_url(state: ConnectedViewState, action: SetWsUrlAction)
      : ConnectedViewState
    {
      const { wsUrl } = action;
      if (state.wsUrl === wsUrl) {
        return state;
      }
      return { ...state, wsUrl };
    },
    set_view_mode(state: ConnectedViewState, action: SetViewModeAction)
      : ConnectedViewState
    {
      const { viewMode } = action;
      if (state.viewMode === viewMode) {
        return state;
      }
      return { ...state, viewMode };
    },
    set_define_rules(state: ConnectedViewState, action: SetDefineRulesAction)
      : ConnectedViewState
    {
      const { defineRules } = action;
      if (state.defineRules === defineRules) {
        return state;
      }
      return { ...state, defineRules };
    },
    define_rules(
      state: ConnectedViewState,
      action: DefineRulesDispatchAction,
    ): ConnectedViewState {
      const defRules = state.defineRules;
      if (!defRules) {
        console.warn("ConnectedViewState.reducer: defRules is null");
        return state;
      }
      return {
        ...state,
        defineRules: DefineRulesViewState.reducer(defRules, action.action),
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
        action as DefineRulesDispatchAction
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

type SetDefineRulesAction = {
  type: "set_define_rules",
  defineRules: DefineRulesViewState,
};

type TargetedConnectedViewAction<T extends ConnectedViewDispatchTargets> = {
  type: "dispatch",
  target: T,
  action: ({ "define_rules": DefineRulesAction })[T],
}

type DefineRulesDispatchAction =
  TargetedConnectedViewAction<"define_rules">;

export default ConnectedViewState;
export type {
  ConnectedViewAction,
  SetWsUrlAction,
  SetViewModeAction,
  SetDefineRulesAction,
  DefineRulesDispatchAction,
};
export {
  ConnectedViewMode
};
