import { Reducer } from "@reduxjs/toolkit";

type PerlinFieldsViewState = {
  register: string,
}

const PerlinFieldsViewState = {
  initialState: {
    register: "",
  } as PerlinFieldsViewState,

  action: {
    setOutregInput(outregInput: string): SetOutregInputAction {
      return {
        type: "set_outreg_input" as const,
        outregInput,
      };
    },
  },

  reducers: {
    set_outreg_input(state: PerlinFieldsViewState, action: SetOutregInputAction)
      : PerlinFieldsViewState
    {
      const { outregInput: register } = action;
      if (state.register === register) {
        return state;
      }
      return { ...state, register };
    },
  },

  reducer(state: PerlinFieldsViewState, action: PerlinFieldsAction)
    : PerlinFieldsViewState
  {
    const type = action.type;
    const fn = PerlinFieldsViewState.reducers[type];
    if (!fn) {
      console.warn("PerlinFieldsViewState.reducer: Unknown action", action);
      return state;
    }
    return (fn as Reducer<PerlinFieldsViewState>)(state, action);
  },
};

type SetOutregInputAction = {
  type: "set_outreg_input",
  outregInput: string,
};

type PerlinFieldsAction =
  | SetOutregInputAction;

export default PerlinFieldsViewState;
export type { SetOutregInputAction, PerlinFieldsAction };
