import { GameSettings } from "../../types/game_settings";
import { WorldDims } from "../../types/world_dims";

export type DefaultSettingsCmd = {
  params: Record<string, never>;
  response: {
    DefaultSettings: {
      settings: GameSettings,
      minWorldDims: WorldDims,
      maxWorldDims: WorldDims,
    };
  }
};
