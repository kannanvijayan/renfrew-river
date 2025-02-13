import { configureStore } from "@reduxjs/toolkit";
import RootState from "../state/root";

export const store = configureStore({
  reducer: RootState.reducer,
});

export type RootStore = typeof store;
export type RootDispatch = RootStore["dispatch"];
