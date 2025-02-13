import UnconnectedViewState, { UnconnectedViewAction } from "./view/unconnected_view";
import ConnectedViewState, { ConnectedViewAction } from "./view/connected_view";
import { Reducer } from "@reduxjs/toolkit";

type ViewMode = "UNCONNECTED" | "CONNECTED";
const ViewMode = {
  UNCONNECTED: "UNCONNECTED" as const,
  CONNECTED: "CONNECTED" as const,
} as const;

type ViewState = {
  mode: ViewMode,
  unconnected: UnconnectedViewState,
  connected: ConnectedViewState,
};

type ViewDispatchTargets = "unconnected" | "connected";

type ViewAction = 
  | DispatchConnectedAction
  | DispatchUnconnectedAction
  | SetModeAction;

type TargetedViewAction<T extends ViewDispatchTargets> = {
  type: "dispatch",
  target: T,
  action: T extends "unconnected" ? UnconnectedViewAction : ConnectedViewAction,
}

const ViewState = {
  initialState: {
    mode: ViewMode.UNCONNECTED,
    unconnected: UnconnectedViewState.initialState,
    connected: ConnectedViewState.initialState,
  } as ViewState,

  action: {
    unconnected(action: UnconnectedViewAction): ViewAction {
      return { type: "dispatch", target: "unconnected", action };
    },
    connected(action: ConnectedViewAction): ViewAction {
      return { type: "dispatch", target: "connected", action };
    },
    setMode(mode: ViewMode): ViewAction {
      return { type: "set_mode", mode };
    }
  },

  reducers: {
    unconnected(state: ViewState, action: TargetedViewAction<"unconnected">)
      : ViewState
    {
      const unconnected =
        UnconnectedViewState.reducer(state.unconnected, action.action);
      return { ...state, unconnected };
    },
    connected(state: ViewState, action: TargetedViewAction<"connected">)
      : ViewState
    {
      const connected =
        ConnectedViewState.reducer(state.connected, action.action);
      return { ...state, connected };
    },
    set_mode(state: ViewState, action: { type: "set_mode", mode: ViewMode })
      : ViewState
    {
      return { ...state, mode: action.mode };
    },
  },

  reducer(state: ViewState, action: ViewAction): ViewState {
    switch (action.type) {
      case "dispatch": {
        const fn = ViewState.reducers[action.target];
        if (!fn) {
          console.warn("ViewState.reducer: Unknown action", action);
          return state;
        }
        return (fn as Reducer<ViewState>)(state, action);
      }
      case "set_mode": {
        return ViewState.reducers.set_mode(state, action);
      }
      default:
        console.warn("ViewState.reducer: Unknown action", action);
        return state;
    }
  },
}

type DispatchUnconnectedAction = {
  type: "dispatch",
  target: "unconnected",
  action: UnconnectedViewAction,
};

type DispatchConnectedAction = {
  type: "dispatch",
  target: "connected",
  action: ConnectedViewAction,
};

type SetModeAction = {
  type: "set_mode",
  mode: ViewMode,
};

export default ViewState;
export type {
  ViewAction,
};
export {
  ViewMode,
};
