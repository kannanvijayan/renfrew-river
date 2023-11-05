import GameClient from "./client/game_client";
import { CellCoord } from "./game/types/cell_coord";
import { Constants } from "./client/protocol/types/constants";
import { GameSettings } from "./client/protocol/types/settings";
import { WorldDims } from "./game/types/world_dims";
import GameWorld from "./game/world";
import { ProgressCallback } from "./util/progress_tracking";
import TopView from "./view/top_view";

/**
 * Top-level manager of game.
 */
export default class Game {
  private static instance: Game | null = null;

  private view: TopView;
  private client: GameClient | null;
  private constants: Constants | null;
  private minWorldDims: WorldDims | null;
  private maxWorldDims: WorldDims | null;
  private currentGameSettings: GameSettings | null;
  private hasCurrentGame: boolean;

  private world: GameWorld | null;

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
        },
      },
    });
  }

  private async connectToServer(server: string): Promise<GameSettings> {
    if (this.client) {
      throw new Error("Game.connectToServer: Already connected to server");
    }
    // Connect to the server.
    const client = await new Promise<GameClient>((resolve, reject) => {
      const client = new GameClient({
        url: server,
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
    this.minWorldDims = defaultSettings.min_world_dims;
    this.maxWorldDims = defaultSettings.max_world_dims;

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
    if (settings.world_dims.columns < this.minWorldDims.columns) {
      errors.push(
        `columns must be at least ${this.minWorldDims.columns}` +
        ` (got ${settings.world_dims.columns})`
      );
    }
    if (settings.world_dims.rows < this.minWorldDims.rows) {
      errors.push(
        `rows must be at least ${this.minWorldDims.rows}` +
        ` (got ${settings.world_dims.rows})`
      );
    }
    if (settings.world_dims.columns > this.maxWorldDims.columns) {
      errors.push(
        `columns must be at most ${this.maxWorldDims.columns}` +
        ` (got ${settings.world_dims.columns})`
      );
    }
    if (settings.world_dims.rows > this.maxWorldDims.rows) {
      errors.push(
        `rows must be at most ${this.maxWorldDims.rows}` +
        ` (got ${settings.world_dims.rows})`
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

    const { columns, rows } = this.currentGameSettings.world_dims;

    // Read the mini-elevations map.
    const miniColumns = 500;
    const miniRows = Math.floor(rows * (miniColumns / columns));
    const miniDims = { columns: 500, rows: miniRows };

    // Initialize the game world.
    this.world = new GameWorld({
      constants: this.constants!,
      worldDims: this.currentGameSettings.world_dims,
      miniDims,
      loaderApi: {
        readMapArea: async ({topLeft, area}) => {
          const result = await this.client!.readMapData({
            topLeft,
            area,
            kinds: ["Elevation", "AnimalId"] as ["Elevation", "AnimalId"],
          });
          // TODO: assert(result.elevations !== null);
          const { elevations, animal_ids } = result;
          return { elevations, animalIds: animal_ids };
        },
      },
    });

    const miniElevs = await this.client!.miniElevations({ miniDims });
    this.world.minimapData.writeElevations(miniElevs);

    // Read animals.
    const animals = await this.client!.readAnimals();
    this.world.addAnimals(animals);

    // Take a turn once a second.
    setInterval(async () => {
      const result = await this.client!.takeTurnStep();
      console.log("Turn taken", result);
      this.world?.mapData.invalidate();
    }, 1000);
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
}