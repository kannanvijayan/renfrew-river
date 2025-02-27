import { RulesetInput, RulesetValidation } from "./types/ruleset/ruleset";
import {
  ProtocolSubcmdParams,
  ProtocolSubcmdName,
  ProtocolSubcmdResponse,
  ProtocolSubcmdSpec,
} from "./protocol/subcommand";
import DefineRulesSubcmd from "./protocol/commands/define_rules/define_rules_subcmd";
import { ProtocolCommandName, ProtocolCommandParams, ProtocolCommandResponse } from "./protocol/command";
import GameModeInfo from "./types/game_mode_info";

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
      enterMode: this.enterMode.bind(this),
      enterMainMenuMode: this.enterMainMenuMode.bind(this),
    });
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

interface SubcmdSender {
  send<
    S extends ProtocolSubcmdSpec,
    T extends ProtocolSubcmdName<S>
  >(
    category: string,
    subcmd: T,
    params: ProtocolSubcmdParams<S, T>,
  ): Promise<ProtocolSubcmdResponse<S, T>>;

  enterMode(mode: GameModeInfo): Promise<true>;
  enterMainMenuMode(): Promise<true>;
}

class GameClientSendSubcommand<S extends ProtocolSubcmdSpec> {
  protected readonly sender_: SubcmdSender;
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
    super(sender, "DefineRules");
  }

  public async enter(): Promise<true> {
    return this.sender_.enterMode({ DefineRules: {}});
  }

  public async leave(): Promise<true> {
    return this.sender_.enterMainMenuMode();
  }

  public async validateRules(rulesetInput: RulesetInput)
    : Promise<true|RulesetValidation>
  {
    const result = await this.sendSubcmd("ValidateRules", { rulesetInput });
    if (result.Validation.isValid) {
      return true;
    } else {
      if (!result.Validation.validation) {
        throw new Error("Validation failed but no validation object");
      }
      return result.Validation.validation;
    }
  }

  public async saveRules(): Promise<true> {
    const result = await this.sendSubcmd("SaveRules", {});
    console.log("SaveRules result:", result);
    if ("RulesSaved" in result) {
      return true;
    }
    throw new Error("SaveRules: unexpected response: " + result.Failed.join(", "));
  }
}
