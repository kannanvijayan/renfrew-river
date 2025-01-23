import GameClient, {
  GameConstants,
  GameSettings,
  SettingsLimits,
  GameSnapshot,
  ShasmParseError,
} from "renfrew-river-protocol-client"
import GameInstance from "./instance";

/**
 * Top-level manager of game.
 */
export default class GameServerSession {
  public readonly serverAddr: string;
  public readonly settingsLimits: SettingsLimits;
  public readonly constants: GameConstants;
  public readonly client: GameClient;

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
    this.client = args.client;
  }

  public async validateShasmProgram(programText: string)
    : Promise<true | ShasmParseError[]>
  {
    return await this.client.validateShasm(programText);
  }

  public async serverHasGameInstance(): Promise<GameSettings|null> {
    const result = await this.client.hasGame();
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

    const instance = await GameInstance.load({
      client: this.client,
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
    await this.client.newGame(settings);
    const instance = await GameInstance.load({
      client: this.client,
      serverSession: this,
      settings,
    });
    this.currentGame_ = instance;
    return instance;
  }

  public async serverLoadGameFromSnapshot(snapshot: GameSnapshot)
    : Promise<GameInstance>
  {
    // Restore the game
    if (this.currentGame_) {
      throw new Error("Already in a game");
    }
    try {
      await this.client.restoreGame(snapshot.data);
    } catch (e) {
      throw new Error(`Failed to load game: ${e}`);
    }

    // Join the restored game.
    const settings = await this.serverHasGameInstance();
    if (settings === null) {
      throw new Error("No game exists");
    }

    const instance = await GameInstance.load({
      client: this.client,
      serverSession: this,
      settings,
    });
    this.currentGame_ = instance;
    return instance;
  }
}
