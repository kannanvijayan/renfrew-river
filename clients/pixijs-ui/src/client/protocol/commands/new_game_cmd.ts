import { GameSettings } from "../types/settings";

export type NewGameCmd = {
  params: {
    settings: GameSettings,
  };
  response: {
    Ok: {};
  }
};