import {
  ProtocolCommandName,
  ProtocolCommandParams,
  ProtocolCommandResponse
} from "./protocol/command";
import { CellCoord } from "../game/types/cell_coord";
import { Constants } from "./protocol/types/constants";
import { AnimalData } from "../game/types/animal_data";
import { GameSettings } from "./protocol/types/settings";
import { WorldDims } from "../game/types/world_dims";
import { ReadMapDataKind, ReadMapDataKindsToOutput, ReadMapDataOutputNameMap } from "./protocol/commands/read_map_data_cmd";
import { TurnStepResult } from "./protocol/types/turn_step_result";
import { CellInfo } from "../game/types/cell_info";

export type GameClientArgs = {
  url: string;
  callbacks: GameClientCallbacks;
};

export type GameClientCallbacks = {
  onConnect: () => void;
  onError: (msg: string) => void;
  onClose?: () => void;
};

export enum GameClientConnectError {
  // Failed to create connection.
  CONNECTION_FAILED = "connection-failed",
}

type ResponseAwaiter = {
  command: ProtocolCommandName;
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
  promise: Promise<unknown>;
};

export default class GameClient {
  // Websocket URL to connect to.
  private readonly url_: string;

  // Callbacks for the game client.
  private readonly callbacks_: GameClientCallbacks;

  // The websocket connection.
  private readonly ws_: WebSocket;

  // Current command response awaiter.
  private responseAwaiters_: ResponseAwaiter[];

  public constructor(args: GameClientArgs) {
    const { url, callbacks } = args;
    this.url_ = url;
    this.callbacks_ = callbacks;
    this.ws_ = new WebSocket(url);
    this.responseAwaiters_ = [];
    this.ws_.addEventListener("open", this.onOpen.bind(this));
    this.ws_.addEventListener("close", this.onClose.bind(this));
    this.ws_.addEventListener("error", e => this.onError("Connection failed", e));
    this.ws_.addEventListener("message", this.onMessage.bind(this));
  }

  public disconnect(): void {
    this.ws_.close();
  }

  public async getConstants(): Promise<Constants> {
    const result = await this.sendCommand("GetConstants", {});
    if ("Constants" in result) {
      return result.Constants;
    }
    console.error("GetConstants: unexpected response", result);
    throw new Error("GetConstants: unexpected response");
  }

  public async defaultSettings()
    : Promise<{
        settings: GameSettings,
        min_world_dims: WorldDims,
        max_world_dims: WorldDims,
      }>
  {
    const result = await this.sendCommand("DefaultSettings", {});
    if ("DefaultSettings" in result) {
      const settings = result.DefaultSettings.settings;
      const min_world_dims = result.DefaultSettings.min_world_dims;
      const max_world_dims = result.DefaultSettings.max_world_dims;
      return { settings, min_world_dims, max_world_dims };
    }
    console.error("DefaultSettings: unexpected response", result);
    throw new Error("DefaultSettings: unexpected response");
  }

  public async hasGame(): Promise<GameSettings | false> {
    const result = await this.sendCommand("HasGame", {});
    if ("GameExists" in result) {
      return result.GameExists.settings;
    } else {
      return false;
    }
  }

  public async newGame(settings: GameSettings): Promise<void> {
    const result = await this.sendCommand("NewGame", { settings });
    if ("Error" in result) {
      throw new Error(result.Error.messages.join(", "));
    }
  }

  public async readMapData<Kinds extends ReadMapDataKind[]>(opts: {
    topLeft: CellCoord,
    area: WorldDims,
    kinds: Kinds,
  }): Promise<ReadMapDataKindsToOutput<Kinds>> {
    const result = await this.sendCommand("ReadMapData", {
      top_left: opts.topLeft,
      area: opts.area,
      kinds: opts.kinds,
    });
    if ("MapData" in result) {
      const retval = {} as Record<string, unknown[][] | null>;
      for (const kind of opts.kinds) {
        const name = ReadMapDataOutputNameMap[kind];
        retval[name] = result.MapData[name];
      }
      return retval as ReadMapDataKindsToOutput<Kinds>;
    } else {
      throw new Error(result.Error.messages.join(", "));
    }
  }

  public async miniElevations(opts: {
    miniDims: WorldDims,
  }): Promise<number[][]> {
    const result = await this.sendCommand("MiniElevations", {
      mini_dims: opts.miniDims,
    });
    if ("MiniElevations" in result) {
      return result.MiniElevations.elevations;
    } else {
      throw new Error(result.Error.messages.join(", "));
    }
  }

  public async readAnimals(): Promise<AnimalData[]> {
    const result = await this.sendCommand("ReadAnimals", {});
    if ("Animals" in result) {
      return result.Animals.animals;
    } else {
      throw new Error(result.Error.messages.join(", "));
    }
  }

  public async takeTurnStep(): Promise<TurnStepResult> {
    const result = await this.sendCommand("TakeTurnStep", {});
    if ("TurnTaken" in result) {
      return result.TurnTaken;
    } else {
      throw new Error(result.Error.messages.join(", "));
    }
  }

  public async getCellInfo(coord: CellCoord): Promise<CellInfo> {
    const result = await this.sendCommand("GetCellInfo", { cell_coord: coord });
    if ("CellInfo" in result) {
      return result.CellInfo;
    } else {
      throw new Error(result.Error.messages.join(", "));
    }
  }

  private async sendCommand<T extends ProtocolCommandName>(
    command: T,
    params: ProtocolCommandParams<T>,
  ): Promise<ProtocolCommandResponse<T>> {
    // Compose the command to send.
    const msgObj = { [command]: params };
    console.debug("GameClient.sendCommand: message", msgObj);
    const msg = JSON.stringify(msgObj);

    // Send the command, but only after the response from the
    // current last command has been received.
    if (this.responseAwaiters_.length > 0) {
      this.responseAwaiters_[this.responseAwaiters_.length - 1].promise.then(
        () => this.ws_.send(msg)
      );
    } else {
      this.ws_.send(msg);
    }

    // Create and push an awaiter for the response.
    let resolve: unknown;
    let reject: unknown;
    const promise = new Promise<ProtocolCommandResponse<T>>((res, rej) => {
      console.debug("GameClient.sendCommand: awaiter created");
      resolve = res;
      reject = rej;
    });
    const awaiter = { command, resolve, reject, promise } as ResponseAwaiter;
    this.responseAwaiters_.push(awaiter);

    return promise;
  }

  private onOpen(): void {
    console.debug("GameClient.onOpen");
    this.callbacks_.onConnect();
  }

  private onClose(): void {
    console.debug("GameClient.onClose");
    for (const awaiter of this.responseAwaiters_) {
      awaiter.reject("Connection closed");
    }
    this.responseAwaiters_ = [];
    this.callbacks_.onClose?.();
  }

  private onError(msg: string, err?: unknown): void {
    console.debug("GameClient.onError", err);
    for (const awaiter of this.responseAwaiters_) {
      awaiter.reject(`Connection errored: ${msg}`);
    }
    this.responseAwaiters_ = [];
    this.callbacks_.onError(msg);
  }

  private onMessage(msg: MessageEvent): void {
    console.debug("GameClient.onMessage");
    // Parse a text message.
    if (typeof msg.data === "string") {
      const data = JSON.parse(msg.data);
      console.debug("GameClient.onMessage: data", data);

      const awaiter = this.responseAwaiters_.shift();
      if (!awaiter) {
        console.error("GameClient.onMessage: no awaiter for message", data);
        throw new Error("GameClient.onMessage: no awaiter");
      }
      awaiter.resolve(data);
      console.debug("GameClient.onMessage: awaiter resolved");
    } else {
      console.error(
        "GameClient.onMessage: unexpected message type",
        typeof msg.data
      );
      throw new Error("GameClient.onMessage: unexpected message type");
    }
  }
}
