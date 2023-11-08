import { CellCoord } from "./types/cell_coord";
import { GameConstants } from "./types/game_constants";
import { AnimalData } from "./types/animal_data";
import { GameSettings } from "./types/game_settings";
import { WorldDims } from "./types/world_dims";
import { CellInfo } from "./types/cell_info";
import { TurnStepResult } from "./types/turn_step_result";
import { ReadMapDataKind, ReadMapDataKindsToOutput } from "./protocol/commands/read_map_data_cmd";
export type GameClientArgs = {
    url: string;
    callbacks: GameClientCallbacks;
};
export type GameClientCallbacks = {
    onConnect: () => void;
    onError: (msg: string) => void;
    onClose?: () => void;
};
export declare enum GameClientConnectError {
    CONNECTION_FAILED = "connection-failed"
}
export default class GameClient {
    private readonly url_;
    private readonly callbacks_;
    private readonly ws_;
    private responseAwaiters_;
    constructor(args: GameClientArgs);
    disconnect(): void;
    getConstants(): Promise<GameConstants>;
    defaultSettings(): Promise<{
        settings: GameSettings;
        min_world_dims: WorldDims;
        max_world_dims: WorldDims;
    }>;
    hasGame(): Promise<GameSettings | false>;
    newGame(settings: GameSettings): Promise<void>;
    readMapData<Kinds extends ReadMapDataKind[]>(opts: {
        topLeft: CellCoord;
        area: WorldDims;
        kinds: Kinds;
    }): Promise<ReadMapDataKindsToOutput<Kinds>>;
    miniElevations(opts: {
        miniDims: WorldDims;
    }): Promise<number[][]>;
    readAnimals(): Promise<AnimalData[]>;
    takeTurnStep(): Promise<TurnStepResult>;
    getCellInfo(coord: CellCoord): Promise<CellInfo>;
    getAnimalData(animalId: number): Promise<AnimalData>;
    private sendCommand;
    private onOpen;
    private onClose;
    private onError;
    private onMessage;
}
