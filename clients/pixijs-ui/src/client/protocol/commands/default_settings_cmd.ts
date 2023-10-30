import { GameSettings } from "../types/settings";
import { WorldDims } from "../../../game/types/world_dims";

export type DefaultSettingsCmd = {
  params: {};
  response: {
    DefaultSettings: {
      settings: GameSettings,
      min_world_dims: WorldDims,
      max_world_dims: WorldDims,
    };
  }
};