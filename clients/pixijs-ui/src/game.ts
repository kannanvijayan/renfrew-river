import GameClient, {
  CellCoord,
  GameConstants,
  GameSettings,
  WorldDims,
  TurnNo,
  CellInfo,
  AnimalData,
  AnimalId,
} from "renfrew-river-protocol-client"
import GameWorld from "./game/world";
import { ProgressCallback } from "./util/progress_tracking";
import TopView from "./view/top_view";
import assert from "./util/assert";
import { GameClientTransportListeners } from "renfrew-river-protocol-client/dist/game_client";

/**
 * Top-level manager of game.
 */
export default class Game {
  private static instance: Game | null = null;

  private view: TopView;
  private client: GameClient | null;
  private constants: GameConstants | null;
  private minWorldDims: WorldDims | null;
  private maxWorldDims: WorldDims | null;
  private currentGameSettings: GameSettings | null;
  private hasCurrentGame: boolean;

  private world: GameWorld | null;
  private turnNo: TurnNo;

  private loadGameProgressCallback: ProgressCallback | null;

  private constructor() {
    this.view = this.createTopView();
    this.client = null;
    this.constants = null;
    this.minWorldDims = null;
    this.maxWorldDims = null;
    this.currentGameSettings = null;
    this.hasCurrentGame = false;
    this.world = null;
    this.turnNo = 0;
    this.loadGameProgressCallback = null;
    if (window) {
      (window as any).GAME = this;
    }
  }

  public static getInstance(): Game {
    if (this.instance === null) {
      this.instance = new Game();
    }
    return this.instance;
  }

  public async start(): Promise<void> {
    this.view.initStartStageView();
    // this.view.initPlayStageView();
  }

  private createTopView(): TopView {
    return new TopView({
      callbackApi: {
        startStage: {
          connectToServer: this.connectToServer.bind(this),
          disconnectFromServer: this.disconnectFromServer.bind(this),
          hasGame: this.hasGame.bind(this),
          currentGameSettings: () => {
            if (!this.currentGameSettings) {
              throw new Error("No current game settings");
            }
            return this.currentGameSettings;
          },
          validateGameSettings: this.validateGameSettings.bind(this),
          setCurrentGameSettings: (settings) => {
            if (this.hasCurrentGame) {
              throw new Error(
                "Cannot set current game settings when game is running"
              );
            }
            this.currentGameSettings = settings;
          },
          createNewGame: this.createNewGame.bind(this),
          setLoadGameProgressCallback:
            this.setLoadGameProgressCallback.bind(this),
          loadGame: this.loadGame.bind(this),
        },

        playStage: {
          newWorldObserver: () => {
            if (!this.world) {
              throw new Error("No world");
            }
            return this.world.newObserver();
          },
          ensureMapDataLoaded: this.ensureMapDataLoaded.bind(this),
          takeTurnStep: this.takeTurnStep.bind(this),
          getCellInfo: this.getCellInfo.bind(this),
          getAnimalData: this.getAnimalData.bind(this),
        },
      },
    });
  }

  private async connectToServer(server: string): Promise<GameSettings> {
    if (this.client) {
      throw new Error("Game.connectToServer: Already connected to server");
    }
    const ws = new WebSocket(server);
    const transport = {
      addEventListener<T extends keyof GameClientTransportListeners>(
        eventType: T,
        listener: GameClientTransportListeners[T]
      ): void {
        switch (eventType) {
          case "open":
            ws.addEventListener("open", listener as any);
            break;
          case "close":
            ws.addEventListener("close", listener as any);
            break;
          case "error":
            ws.addEventListener("error", listener as any);
            break;
          case "message":
            ws.addEventListener("message", (event) => {
              if (typeof event.data !== "string") {
                throw new Error("Expected string data");
              }
              listener(event.data);
            });
            break;
          default:
            throw new Error(`Unknown event type ${eventType}`);
        }
      },
      close(): void {
        ws.close();
      },
      send(data: string): void {
        ws.send(data);
      }
    };
    // Connect to the server.
    const client = await new Promise<GameClient>((resolve, reject) => {
      const client = new GameClient({
        transport,
        callbacks: {
          onConnect: () => {
            console.log("Connected to server", server);
            resolve(client);
          },
          onError: () => {
            console.log("Failed to connect to server", server);
            reject();
          },
          onClose: () => {
            console.log("Remote server disconnected", server);
            this.handleRemoteDisconnect();
          },
        },
      });
    });
    this.client = client;

    // Get the game constants.
    const constants = await client.getConstants();
    this.constants = constants;
    console.log("Got game constants", constants);

    // Always get the default settings.
    const defaultSettings = await client.defaultSettings();
    console.log("Got default settings", defaultSettings);
    this.minWorldDims = defaultSettings.minWorldDims;
    this.maxWorldDims = defaultSettings.maxWorldDims;

    // If succesffully connected, check for an existing game.
    // If there is one, set current settings to that game's settings.
    const gameSettings = await this.client!.hasGame();
    if (gameSettings) {
      this.hasCurrentGame = true;
      this.currentGameSettings = gameSettings;
      return gameSettings;
    } else {
      // If there is no current game, get the default settings.
      this.hasCurrentGame = false;
      this.currentGameSettings = defaultSettings.settings;
    }
    return this.currentGameSettings;
  }

  private handleRemoteDisconnect(): void {
    this.hasCurrentGame = false;
    this.currentGameSettings = null;
    if (this.client) {
      this.client = null;
      this.view.onRemoteDisconnect();
    }
  }

  private disconnectFromServer(): void {
    if (this.client) {
      this.client.disconnect();
      this.client = null;
    }
    this.hasCurrentGame = false;
    this.currentGameSettings = null;
  }

  private validateGameSettings(
    settings: GameSettings,
    errors: string[]
  ): boolean {
    if (!this.minWorldDims || !this.maxWorldDims) {
      throw new Error("No min/max world dims");
    }
    const worldDims = settings.worldDims;
    if (worldDims.columns < this.minWorldDims.columns) {
      errors.push(
        `columns must be at least ${this.minWorldDims.columns}` +
        ` (got ${worldDims.columns})`
      );
    }
    if (worldDims.rows < this.minWorldDims.rows) {
      errors.push(
        `rows must be at least ${this.minWorldDims.rows}` +
        ` (got ${worldDims.rows})`
      );
    }
    if (worldDims.columns > this.maxWorldDims.columns) {
      errors.push(
        `columns must be at most ${this.maxWorldDims.columns}` +
        ` (got ${worldDims.columns})`
      );
    }
    if (worldDims.rows > this.maxWorldDims.rows) {
      errors.push(
        `rows must be at most ${this.maxWorldDims.rows}` +
        ` (got ${worldDims.rows})`
      );
    }
    return errors.length === 0;
  }

  private async hasGame(): Promise<GameSettings | false> {
    return this.hasCurrentGame ? this.currentGameSettings! : false;
  }

  private async createNewGame(): Promise<void> {
    if (!this.currentGameSettings) {
      throw new Error("No current game settings");
    }
    await this.client!.newGame(this.currentGameSettings);
    this.hasCurrentGame = true;
  }

  private async setLoadGameProgressCallback(
    progressCallback: ProgressCallback
  ): Promise<void> {
    this.loadGameProgressCallback = progressCallback;
  }

  private async loadGame(): Promise<void> {
    if (!this.hasCurrentGame) {
      throw new Error("Game.loadGame: No current game");
    }
    if (!this.currentGameSettings) {
      throw new Error("Game.loadGame: No current game settings");
    }
    if (!this.client) {
      throw new Error("Game.loadGame: Sanity error: client is null");
    }

    const { columns, rows } = this.currentGameSettings.worldDims;

    // Read the mini-elevations map.
    const miniColumns = 500;
    const miniRows = Math.floor(rows * (miniColumns / columns));
    const miniDims = { columns: 500, rows: miniRows };

    // Initialize the game world.
    this.world = new GameWorld({
      constants: this.constants!,
      worldDims: this.currentGameSettings.worldDims,
      miniDims,
      loaderApi: {
        readMapArea: async ({topLeft, area}) => {
          const result = await this.client!.readMapData({
            topLeft,
            area,
            kinds: ["Elevation", "AnimalId"] as ["Elevation", "AnimalId"],
          });
          // TODO: assert(result.elevations !== null);
          const { elevations, animalIds } = result;
          return { elevations, animalIds };
        },
      },
    });

    const miniElevs = await this.client!.miniElevations({ miniDims });
    this.world.minimapData.writeElevations(miniElevs);

    // Read animals.
    const animals = await this.client!.readAnimals();
    this.world.addAnimals(animals);

    /*
    // Take a turn once a second.
    setInterval(async () => {
      const result = await this.client!.takeTurnStep();
      console.log("Turn taken", result);
      this.world?.mapData.invalidate();
    }, 1000);
    */
  }

  private ensureMapDataLoaded(topLeft: CellCoord, area: WorldDims)
    : Promise<{
        tilesUpdated: number,
        tilesInvalidated: number,
        surroundingsLoaded: Promise<{
          tilesUpdated: number,
          tilesInvalidated: number,
        }>,
      }>
  {
    if (!this.world) {
      throw new Error("Game.ensureElevationsLoaded: No world");
    }
    return this.world.mapData.ensureViewAndQueueSurroundings(topLeft, area);
  }

  private async takeTurnStep(): Promise<void> {
    assert(this.client !== null, "Game.takeTurnStep: No client");
    assert(this.world !== null, "Game.takeTurnStep: No world");
    const result = await this.client.takeTurnStep();
    console.log("Turn taken", result);
    this.turnNo = result.turnNoAfter;
    this.world.mapData.invalidate();
  }

  private async getCellInfo(coord: CellCoord): Promise<CellInfo> {
    assert(this.client !== null, "Game.getCellInfo: No client");
    return this.client.getCellInfo(coord);
  }

  private async getAnimalData(animalId: AnimalId): Promise<AnimalData> {
    assert(this.client !== null, "Game.getAnimalData: No client");
    return this.client.getAnimalData(animalId);
  }
}
