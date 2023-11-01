import { EmptyObject } from "../../../util/empty_object";
import { GameSettings } from "../types/settings";

export type HasGameCmd = {
  params: EmptyObject;
  response: {
    GameExists: {
      settings: GameSettings,
    };
    NoGameExists: EmptyObject;
  }
};