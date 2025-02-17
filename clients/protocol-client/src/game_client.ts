import {
  ProtocolCommandName,
  ProtocolCommandParams,
  ProtocolCommandResponse
} from "./protocol/command";
import { CellCoord } from "./types/cell_coord";
import { GameConstants } from "./types/game_constants";
import { AnimalData } from "./types/animal_data";
import { GameSettings } from "./types/game_settings";
import { WorldDims } from "./types/world_dims";
import { CellInfo } from "./types/cell_info";
import { TurnStepResult } from "./types/turn_step_result";
import { SettingsLimits } from "./types/settings_limits";
import { GameSnapshot } from "./types/game_snapshot";
import {
  ReadMapDataKind,
  ReadMapDataKindsToOutput,
  ReadMapDataOutputNameMap
} from "./protocol/commands/read_map_data_cmd";
import Ruleset, { RulesetInput, RulesetValidation } from "./types/ruleset";
import { ShasmParseError } from "./types/shady_vm";
import {
  ProtocolSubcmdParams,
  ProtocolSubcmdName,
  ProtocolSubcmdResponse,
  ProtocolSubcmdSpec,
} from "./protocol/subcommand";
import DefineRulesSubcmd from "./protocol/commands/define_rules_subcmd";

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
  // Callbacks for the game client.
  private readonly callbacks_: GameClientCallbacks;

  // The transport for the client.
  private readonly transport_: GameClientTransport;

  // Current command response awaiter.
  private responseAwaiters_: ResponseAwaiter[];

  // The define-rules subcommand sender.
  public readonly defineRules: GameClientDefineRules;

  public constructor(args: GameClientArgs) {
    const { transport, callbacks } = args;
    this.callbacks_ = callbacks;
    this.transport_ = transport;
    this.responseAwaiters_ = [];
    this.transport_.addEventListener("open", this.handleOpen.bind(this));
    this.transport_.addEventListener("close", this.handleClose.bind(this));
    this.transport_.addEventListener("error", this.handleError.bind(this));
    this.transport_.addEventListener("message", this.handleMessage.bind(this));

    this.defineRules = new GameClientDefineRules({
      send: this.sendSubcmd.bind(this),
    });
  }

  public disconnect(): void {
    this.transport_.close();
  }

  public async getConstants(): Promise<GameConstants> {
    const result = await this.sendCommand("GetConstants", {});
    if ("Constants" in result) {
      return result.Constants;
    }
    throw new Error("GetConstants: unexpected response");
  }

  public async defaultSettings(): Promise<SettingsLimits> {
    const result = await this.sendCommand("DefaultSettings", {});
    if ("DefaultSettings" in result) {
      const settings = result.DefaultSettings.settings;
      const minWorldDims = result.DefaultSettings.minWorldDims;
      const maxWorldDims = result.DefaultSettings.maxWorldDims;
      return { settings, minWorldDims, maxWorldDims };
    }
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
    const result = await this.sendCommand("ReadMapData", opts);
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
      miniDims: opts.miniDims,
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
    const result = await this.sendCommand("GetCellInfo", {
      cellCoord: coord,
    });
    if ("CellInfo" in result) {
      return result.CellInfo;
    } else {
      throw new Error(result.Error.messages.join(", "));
    }
  }

  public async getAnimalData(animalId: number): Promise<AnimalData> {
    const result = await this.sendCommand("GetAnimalData", {
      animalId: animalId,
    });
    if ("AnimalData" in result) {
      return result.AnimalData;
    } else {
      throw new Error(result.Error.messages.join(", "));
    }
  }

  public async snapshotGame(): Promise<GameSnapshot> {
    const result = await this.sendCommand("SnapshotGame", {});
    if ("GameSnapshot" in result) {
      return result.GameSnapshot;
    } else {
      throw new Error(result.Error.messages.join(", "));
    }
  }

  public async restoreGame(snapshot: string): Promise<void> {
    const result = await this.sendCommand("RestoreGame", { snapshot });
    if ("Ok" in result) {
      return;
    } else {
      throw new Error(result.Error.messages.join(", "));
    }
  }

  public async validateShasm(programText: string):
    Promise<true | ShasmParseError[]>
  {
    const result = await this.sendCommand("ValidateShasm", { programText });
    if ("Ok" in result) {
      return true;
    } else if ("InvalidShasm" in result) {
      return result.InvalidShasm.errors;
    } else {
      throw new Error(`ValidateShasm: ${result.Error.messages.join(",")}`);
    }
  }

  public async defineRuleset(args: {
    name: string,
    description?: string,
    ruleset: Ruleset,
  }): Promise<void> {
    let { name, description, ruleset } = args;
    const result = await this.sendCommand("DefineRuleset", {
      name,
      description: description || "",
      ruleset,
    });
    if ("Ok" in result) {
      return;
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
    const msg = JSON.stringify(msgObj);

    // Send the command, but only after the response from the
    // current last command has been received.
    if (this.responseAwaiters_.length > 0) {
      this.responseAwaiters_[this.responseAwaiters_.length - 1].promise.then(
        () => this.transport_.send(msg)
      );
    } else {
      this.transport_.send(msg);
    }

    // Create and push an awaiter for the response.
    let resolve: unknown;
    let reject: unknown;
    const promise = new Promise<ProtocolCommandResponse<T>>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    const awaiter = { command, resolve, reject, promise } as ResponseAwaiter;
    this.responseAwaiters_.push(awaiter);

    return promise;
  }

  private async sendSubcmd<
    S extends ProtocolSubcmdSpec,
    T extends ProtocolSubcmdName<S>
  >(
    category: string,
    subcmd: T,
    params: ProtocolSubcmdParams<S, T>,
  ): Promise<ProtocolSubcmdResponse<S, T>> {
    // Compose the command to send.
    const msgObj = { [category]: { [subcmd]: params } };
    const msg = JSON.stringify(msgObj);

    // Send the command, but only after the response from the
    // current last command has been received.
    if (this.responseAwaiters_.length > 0) {
      this.responseAwaiters_[this.responseAwaiters_.length - 1].promise.then(
        () => this.transport_.send(msg)
      );
    } else {
      this.transport_.send(msg);
    }

    // Create and push an awaiter for the response.
    let resolve: unknown;
    let reject: unknown;
    const promise = new Promise<ProtocolSubcmdResponse<S, T>>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    const awaiter = { command: subcmd, resolve, reject, promise } as ResponseAwaiter;
    this.responseAwaiters_.push(awaiter);

    return promise
  }

  private handleOpen(): void {
    this.callbacks_.onConnect();
  }

  private handleClose(): void {
    for (const awaiter of this.responseAwaiters_) {
      awaiter.reject("Connection closed");
    }
    this.responseAwaiters_ = [];
    this.callbacks_.onClose?.();
  }

  private handleError(err?: unknown): void {
    for (const awaiter of this.responseAwaiters_) {
      if (err instanceof Error) {
        awaiter.reject(err);
      } else {
        awaiter.reject(new Error(`Connection error: ${err}`));
      }
    }
    this.responseAwaiters_ = [];
    this.callbacks_.onError(err);
  }

  private handleMessage(msg: string): void {
    // Parse a text message.
    const data = JSON.parse(msg);
    const awaiter = this.responseAwaiters_.shift();
    if (!awaiter) {
      throw new Error("GameClient.onMessage: no awaiter");
    }
    awaiter.resolve(data);
  }
}

interface SubcmdSender {
  send<
    S extends ProtocolSubcmdSpec,
    T extends ProtocolSubcmdName<S>
  >(
    category: string,
    subcmd: T,
    params: ProtocolSubcmdParams<S, T>,
  ): Promise<ProtocolSubcmdResponse<S, T>>;
}

class GameClientSendSubcommand<S extends ProtocolSubcmdSpec> {
  private readonly sender_: SubcmdSender;
  private readonly category_: string;

  public constructor(sender: SubcmdSender, category: string) {
    this.sender_ = sender;
    this.category_ = category;
  }

  protected async sendSubcmd<T extends ProtocolSubcmdName<S>>(
    subcmd: T,
    params: ProtocolSubcmdParams<S, T>,
  ): Promise<ProtocolSubcmdResponse<S, T>> {
    return this.sender_.send(this.category_, subcmd, params);
  }
}

export class GameClientDefineRules
  extends GameClientSendSubcommand<DefineRulesSubcmd>
{
  public constructor(sender: SubcmdSender) {
    super(sender, "DefineRulesSubcmd");
  }

  public async validateRules(rulesetInput: RulesetInput)
    : Promise<true|RulesetValidation>
  {
    const result = await this.sendSubcmd("ValidateRules", { rulesetInput });
    if ("Validation" in result) {
      if (result.Validation.isValid) {
        return true;
      } else {
        if (!result.Validation.validation) {
          throw new Error("Validation failed but no validation object");
        }
        return result.Validation.validation;
      }
    } else {
      throw new Error(
        "ValidateRules: unexpected response: " + result.Error.messages.join(", ")
      );
    }
  }
}
