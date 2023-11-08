import { GameSettings } from "../../types/game_settings";
import { WorldDims } from "../../types/world_dims";
export type DefaultSettingsCmd = {
    params: Record<string, never>;
    response: {
        DefaultSettings: {
            settings: GameSettings;
            min_world_dims: WorldDims;
            max_world_dims: WorldDims;
        };
    };
};
