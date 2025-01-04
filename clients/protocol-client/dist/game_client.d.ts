import { CellCoord } from "./types/cell_coord";
import { GameConstants } from "./types/game_constants";
import { AnimalData } from "./types/animal_data";
import { GameSettings } from "./types/game_settings";
import { WorldDims } from "./types/world_dims";
import { CellInfo } from "./types/cell_info";
import { TurnStepResult } from "./types/turn_step_result";
import { SettingsLimits } from "./types/settings_limits";
import { ReadMapDataKind, ReadMapDataKindsToOutput } from "./protocol/commands/read_map_data_cmd";
export type GameClientTransportListeners = {
    open: () => void;
    close: () => void;
    error: (err: unknown) => void;
    message: (msg: string) => void;
};
/** The transport used by the game client to talk to the game server. */
export interface GameClientTransport {
    addEventListener(type: "open", listener: () => void): void;
    addEventListener(type: "close", listener: () => void): void;
    addEventListener(type: "error", listener: (error?: unknown) => void): void;
    addEventListener(type: "message", listener: (message: string) => void): void;
    close(): void;
    send(data: string): void;
}
export type GameClientArgs = {
    transport: GameClientTransport;
    callbacks: GameClientCallbacks;
};
export type GameClientCallbacks = {
    onConnect: () => void;
    onError: (err: unknown) => void;
    onClose?: () => void;
};
export declare enum GameClientConnectError {
    CONNECTION_FAILED = "connection-failed"
}
export default class GameClient {
    private readonly callbacks_;
    private readonly transport_;
    private responseAwaiters_;
    constructor(args: GameClientArgs);
    disconnect(): void;
    getConstants(): Promise<GameConstants>;
    defaultSettings(): Promise<SettingsLimits>;
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
    private handleOpen;
    private handleClose;
    private handleError;
    private handleMessage;
}
