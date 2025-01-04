import GameClient, { GameConstants, GameSettings, SettingsLimits }
  from "renfrew-river-protocol-client"
import GameInstance from "./instance";

/**
 * Top-level manager of game.
 */
export default class GameServerSession {
  public readonly serverAddr: string;
  public readonly settingsLimits: SettingsLimits;
  public readonly constants: GameConstants;
  private readonly client_: GameClient;

  private currentGame_: GameInstance | null = null;

  public constructor(args: {
    serverAddr: string,
    settingsLimits: SettingsLimits,
    constants: GameConstants,
    client: GameClient,
  }) {
    this.serverAddr = args.serverAddr;
    this.settingsLimits = args.settingsLimits;
    this.constants = args.constants;
    this.client_ = args.client;
  }

  public async serverHasGameInstance(): Promise<GameSettings|null> {
    const result = await this.client_.hasGame();
    return result || null;
  }

  public async serverJoinExistingGame(): Promise<GameInstance> {
    if (this.currentGame_) {
      throw new Error("Already in a game");
    }
    const settings = await this.serverHasGameInstance();
    if (settings === null) {
      throw new Error("No game exists");
    }

    const instance = new GameInstance({
      client: this.client_,
      serverSession: this,
      settings,
    });
    this.currentGame_ = instance;
    return instance;
  }

  public async serverStartNewGame(settings: GameSettings): Promise<GameInstance> {
    if (this.currentGame_) {
      throw new Error("Already in a game");
    }
    await this.client_.newGame(settings);
    const instance = new GameInstance({
      client: this.client_,
      serverSession: this,
      settings,
    });
    this.currentGame_ = instance;
    return instance;
  }
}
