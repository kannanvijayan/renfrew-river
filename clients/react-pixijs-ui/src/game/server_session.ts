import GameClient, { GameConstants, SettingsLimits }
  from "renfrew-river-protocol-client"

/**
 * Top-level manager of game.
 */
export default class GameServerSession {
  public readonly serverAddr: string;
  private readonly client: GameClient;
  private readonly constants: GameConstants;
  private readonly settingsLimits: SettingsLimits;

  public constructor(args: {
    serverAddr: string,
    client: GameClient,
    constants: GameConstants,
    settingsLimits: SettingsLimits,
  }) {
    this.serverAddr = args.serverAddr;
    this.client = args.client;
    this.constants = args.constants;
    this.settingsLimits = args.settingsLimits;
  }
}
