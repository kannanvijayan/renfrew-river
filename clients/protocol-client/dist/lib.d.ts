import GameClient from "./game_client";
import { AnimalId, AnimalData, INVALID_ANIMAL_ID } from "./types/animal_data";
import { CellCoord } from "./types/cell_coord";
import { CellInfo } from "./types/cell_info";
import { Elevation } from "./types/elevation";
import { TurnNo } from "./types/turn_no";
import { WorldDims } from "./types/world_dims";
import { GameConstants } from "./types/game_constants";
import { GameSettings } from "./types/game_settings";
import { TurnStepResult } from "./types/turn_step_result";
export default GameClient;
export { WorldDims, CellCoord, Elevation, AnimalId, INVALID_ANIMAL_ID, AnimalData, CellInfo, TurnNo, GameConstants, GameSettings, TurnStepResult, };
