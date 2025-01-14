import GameClient, { GameSettings, GameSnapshot } from "renfrew-river-protocol-client";
import GameServerSession from "./server_session";
import GameSurface from './surface';
import WorldObserver from "./world_observer";
import GameWorld from "./world";

/**
 * Proxies a running instance of a game on a server.
 */
export default class GameInstance {
  private readonly client_: GameClient;

  public readonly serverSession: GameServerSession;
  public readonly settings: GameSettings;

  private readonly world_: GameWorld;
  private worldObserver_: WorldObserver;
  private surface_: GameSurface | null = null;

  private constructor(args: {
    client: GameClient,
    serverSession: GameServerSession,
    settings: GameSettings,
    world: GameWorld,
  }) {
    this.client_ = args.client;
    this.serverSession = args.serverSession;
    this.settings = args.settings;

    this.world_ = args.world;
    this.worldObserver_ = this.world_.newObserver();
  }

  public static async load(args: {
    client: GameClient,
    serverSession: GameServerSession,
    settings: GameSettings,
  }): Promise<GameInstance> {
    const { client, serverSession, settings } = args;

    const worldDims = settings.worldDims;
    const miniColumns = 500;
    const miniRows = 0|(worldDims.rows * miniColumns / worldDims.columns);

    const world = await GameWorld.load({
      client,
      constants: serverSession.constants,
      worldDims: settings.worldDims,
      miniDims: { columns: miniColumns, rows: miniRows },
    });
    return new GameInstance({ client, serverSession, settings, world });
  }

  public async snapshotGame(): Promise<GameSnapshot> {
    return this.client_.snapshotGame();
  }

  public handleCanvasMounted(canvas: HTMLCanvasElement): void {
    // Mounted the same canvas.
    if (this.surface_?.matchesCanvas(canvas)) {
      return;
    }


    // Destroy the old surface.
    if (this.surface_) {
      this.surface_.destroy();
    }

    this.surface_ = new GameSurface({
      canvas,
      worldObserver: this.worldObserver_,
      callbackApi: {
        ensureMapDataLoaded: async (topleft, area) => {
          return this.world_.ensureViewAndQueueSurroundings(topleft, area);
        },
        getAnimalData: async (animalId) => {
          return this.client_.getAnimalData(animalId);
        },
        getCellInfo: async (cell) => {
          return this.client_.getCellInfo(cell);
        },
        takeTurnStep: async () => {
          await this.client_.takeTurnStep();
          this.world_.invalidateMapData();
        },
      }
    });
  }

  public handleCanvasUnmounted(canvas: HTMLCanvasElement): void {
    if (this.surface_) {
      if (! this.surface_.matchesCanvas(canvas)) {
        console.error("Canvas does not match on unmount");
      }
      this.surface_.destroy();
      this.surface_ = null;
    }
  }
}
