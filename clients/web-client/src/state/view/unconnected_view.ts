import { Reducer } from "@reduxjs/toolkit";

type UnconnectedViewState = {
  wsUrlInput: string,
};

const UnconnectedViewState = {
  initialState: {
    wsUrlInput: "",
  } as UnconnectedViewState,

  action: {
    setWsUrlInput(wsUrlInput: string): SetWsUrlInputAction {
      return {
        type: "set_ws_url_input",
        wsUrlInput,
      };
    }
  },

  reducers: {
    set_ws_url_input(state: UnconnectedViewState, action: SetWsUrlInputAction)
      : UnconnectedViewState
    {
      return {
        ...state,
        wsUrlInput: action.wsUrlInput,
      };
    },
  },

  reducer(state: UnconnectedViewState, action: UnconnectedViewAction)
    : UnconnectedViewState
  {
    const fn = UnconnectedViewState.reducers[action.type];
    if (!fn) {
      console.warn("UnconnectedViewState.reducer: Unknown action", action);
      return state;
    }
    return (fn as Reducer<UnconnectedViewState>)(state, action);
  },

  utility: {
    validate: {
      wsUrlInput(wsUrlInput: string): boolean {
        return wsUrlInput.length > 0 && wsUrlInput.startsWith("ws://");
      },
    },
  },
};


type SetWsUrlInputAction = {
  type: "set_ws_url_input",
  wsUrlInput: string,
};
type UnconnectedViewAction = SetWsUrlInputAction;

export default UnconnectedViewState;
export type {
  UnconnectedViewAction,
  SetWsUrlInputAction,
};
