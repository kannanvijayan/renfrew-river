import { WorldDims } from "./world_dims";
import { GameSettings } from "./game_settings";

export type SettingsLimits = {
  settings: GameSettings,
  minWorldDims: WorldDims,
  maxWorldDims: WorldDims,
};
