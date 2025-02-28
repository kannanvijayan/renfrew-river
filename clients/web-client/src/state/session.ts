import { RulesetEntry } from "renfrew-river-protocol-client";

type SessionState = {
  wsUrl: string | null,
  rulesetList: RulesetEntry[] | null,
};

type SetWsUrlAction = { type: "set_ws_url", wsUrl: string | null };
type SetRulesetListAction = {
  type: "set_ruleset_list",
  rulesetList: RulesetEntry[]
};
type SessionAction = 
  | SetWsUrlAction
  | SetRulesetListAction;

const SessionState = {
  initialState: {
    wsUrl: null,
    rulesetList: null,
  } as SessionState,

  action: {
    setWsUrl(wsUrl: string | null): SessionAction {
      return { type: "set_ws_url", wsUrl };
    },
    setRulesetList(rulesetList: RulesetEntry[]): SessionAction {
      return { type: "set_ruleset_list", rulesetList };
    },
  },

  reducers: {
    set_ws_url(state: SessionState, action: SetWsUrlAction): SessionState {
      const { wsUrl } = action;
      if (state.wsUrl === wsUrl) {
        return state;
      }
      return { ...state, wsUrl };
    },
    set_ruleset_list(
      state: SessionState,
      action: SetRulesetListAction
    ): SessionState {
      const { rulesetList } = action;
      if (state.rulesetList === rulesetList) {
        return state;
      }
      return { ...state, rulesetList };
    },
  },

  reducer(state: SessionState, action: SessionAction): SessionState {
    switch (action.type) {
      case "set_ws_url": {
        return SessionState.reducers.set_ws_url(state, action);
      }
      case "set_ruleset_list": {
        return SessionState.reducers.set_ruleset_list(state, action);
      }
      default:
        console.warn("ViewState.reducer: Unknown action", action);
        return state;
    }
  },
}

export default SessionState;
export type {
  SessionAction,
};
