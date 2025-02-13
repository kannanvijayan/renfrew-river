import { createSlice } from '@reduxjs/toolkit';
import { GameConstants, SettingsLimits } from 'renfrew-river-protocol-client';

export type ServerSessionInfo = {
  readonly serverAddr: string;
  readonly settingsLimits: SettingsLimits;
  readonly constants: GameConstants;
};

export type AppViewMode =
  | { Unconnected: null }
  | { Connected: { session: ServerSessionInfo } };

export type AppState = {
  readonly viewMode: AppViewMode;
}

const initialAppState: AppState = {
  viewMode: { Unconnected: null },
};

type SetConnectedAction = {
  type: 'app/setConnected';
  payload: ServerSessionInfo;
};

const appSlice = createSlice({
  name: 'app',
  initialState: initialAppState,
  reducers: {
    setConnected(state, action) {
      state.viewMode = { Connected: { session: action.payload } };
    },
    setUnconnected(state) {
      state.viewMode = { Unconnected: null };
    },
  },
});
