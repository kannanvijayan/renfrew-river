import { GameSettings } from "../types/settings";

export type HasGameCmd = {
  params: {};
  response: {
    GameExists: {
      settings: GameSettings,
    };
    NoGameExists: {};
  }
};