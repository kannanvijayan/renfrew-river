import { GameConstants } from "../../types/game_constants";

export type GetConstantsCmd = {
  params: Record<string, never>;
  response: {
    Constants: GameConstants;
  }
};
