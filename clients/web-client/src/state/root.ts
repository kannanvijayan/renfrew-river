import { Reducer } from "@reduxjs/toolkit";
import SessionState, { SessionAction } from "./session";
import ViewState, { ViewAction } from "./view";

type RootState = {
  view: ViewState,
  session: SessionState,
};

type RootAction = 
  | { type: "dispatch", target: "view", action: ViewAction }
  | { type: "dispatch", target: "session", action: SessionAction };

type TargetedRootAction<T extends string> = RootAction & { target: T };

const RootState = {
  initialState: {
    view: ViewState.initialState,
    session: SessionState.initialState,
  } as RootState,

  action: {
    view(action: ViewAction): RootAction {
      return { type: "dispatch", target: "view", action };
    },
    session(action: SessionAction): RootAction {
      return { type: "dispatch", target: "session", action };
    }
  },

  reducers: {
    view(state: RootState, action: TargetedRootAction<"view">): RootState {
      return {
        ...state,
        view: ViewState.reducer(state.view, action.action),
      };
    },
    session(state: RootState, action: TargetedRootAction<"session">): RootState {
      return {
        ...state,
        session: SessionState.reducer(state.session, action.action),
      };
    },
  },

  reducer(state: RootState | undefined, action: RootAction): RootState {
    if (!state) {
      return RootState.initialState;
    }

    switch (action.type) {
      case "dispatch": {
        const fn = RootState.reducers[action.target] as Reducer<RootState>;
        if (!fn) {
          console.warn("RootState.reducer: Unknown action", action);
          return state;
        }
        return fn(state, action);
      }
      default:
        console.warn("RootState.reducer: Unknown action", action);
        return state;
    }
  }
}

export default RootState;
export type {
  RootAction,
};
