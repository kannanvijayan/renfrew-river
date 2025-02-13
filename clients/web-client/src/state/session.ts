type SessionState = {
  wsUrl: string | null,
};

type SetWsUrlAction = { type: "set_ws_url", wsUrl: string | null };
type SessionAction = 
  | SetWsUrlAction;

const SessionState = {
  initialState: {
    wsUrl: null,
  } as SessionState,

  action: {
    setWsUrl(wsUrl: string | null): SessionAction {
      return { type: "set_ws_url", wsUrl };
    },
  },

  reducers: {
    set_ws_url(state: SessionState, action: SetWsUrlAction): SessionState {
      return {
        ...state,
        wsUrl: action.wsUrl,
      };
    },
  },

  reducer(state: SessionState, action: SessionAction): SessionState {
    switch (action.type) {
      case "set_ws_url": {
        return SessionState.reducers.set_ws_url(state, action);
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
