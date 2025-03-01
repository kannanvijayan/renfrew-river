import { RulesetEntry } from "../types/ruleset/ruleset";
import {
  ProtocolSubcmdParams,
  ProtocolSubcmdName,
  ProtocolSubcmdResponse,
  ProtocolSubcmdSpec,
} from "../protocol/subcommand";
import {
  ProtocolCommandName,
  ProtocolCommandParams,
  ProtocolCommandResponse,
} from "../protocol/command";
import GameModeInfo from "../types/game_mode_info";
import GameClientTransport from "./transport";
import GameClientTransportListeners from "./transport_listeners";
import { GameClientDefineRulesModule } from "./define_rules_module";
import { GameClientCreateWorldModule } from "./create_world_module";
import SubcmdSender from "./subcmd_sender";

export {
  GameClientTransport,
  GameClientTransportListeners,
  GameClientDefineRulesModule,
};

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

  public readonly defineRules: GameClientDefineRulesModule;
  public readonly createWorld: GameClientCreateWorldModule;

  public constructor(args: GameClientArgs) {
    const { transport, callbacks } = args;
    this.callbacks_ = callbacks;
    this.transport_ = transport;
    this.responseAwaiters_ = [];
    this.transport_.addEventListener("open", this.handleOpen.bind(this));
    this.transport_.addEventListener("close", this.handleClose.bind(this));
    this.transport_.addEventListener("error", this.handleError.bind(this));
    this.transport_.addEventListener("message", this.handleMessage.bind(this));

    let subcmdSender = {
      send: this.sendSubcmd.bind(this),
      enterMode: this.enterMode.bind(this),
      enterMainMenuMode: this.enterMainMenuMode.bind(this),
    };

    this.defineRules = new GameClientDefineRulesModule(subcmdSender);
    this.createWorld = new GameClientCreateWorldModule(subcmdSender);
  }

  public disconnect(): void {
    this.transport_.close();
  }

  public async getModeInfo(): Promise<GameModeInfo | null> {
    const result = await this.sendCommand("GetModeInfo", {});
    if ("InMode" in result) {
      return result.InMode;
    }
    return null;
  }

  public async listRulesets(): Promise<RulesetEntry[]> {
    const result = await this.sendCommand("ListRulesets", {});
    if ("RulesetList" in result) {
      return result.RulesetList;
    }
    throw new Error("ListRulesets: unexpected response");
  }

  private async enterMode(mode: GameModeInfo): Promise<true> {
    const result = await this.sendCommand("EnterMode", { mode });
    if ("Ok" in result) {
      return true;
    }
    throw new Error("EnterMode: unexpected response: " + result.Error.join(", "));
  }

  private async enterMainMenuMode(): Promise<true> {
    const result = await this.sendCommand("EnterMainMenuMode", {});
    if ("Ok" in result) {
      return true;
    }
    throw new Error("EnterMainMenuMode: unexpected response: " + result.Error.join(", "));
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
    C extends string,
    S extends ProtocolSubcmdSpec,
    T extends ProtocolSubcmdName<S>
  >(
    category: C,
    subcmd: T,
    params: ProtocolSubcmdParams<S, T>,
  ): Promise<ProtocolSubcmdResponse<S, T>> {
    const categorySubcmd = `${category}Subcmd` as const;
    type CategorySubcmdType = typeof categorySubcmd;
    // Compose the command to send.
    const msgObj = { [categorySubcmd]: { [subcmd]: params } };
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
    const promise = new Promise<{
      [T in CategorySubcmdType]: ProtocolSubcmdResponse<S, T>
    }>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    const awaiter = { command: subcmd, resolve, reject, promise } as ResponseAwaiter;
    this.responseAwaiters_.push(awaiter);

    const resp = await promise;
    return resp[categorySubcmd];
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
