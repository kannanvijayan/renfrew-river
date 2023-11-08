import { EmptyObject } from "../../util/empty_object";
import { GameSettings } from "../../types/game_settings";

export type NewGameCmd = {
  params: {
    settings: GameSettings,
  };
  response: {
    Ok: EmptyObject;
  }
};
