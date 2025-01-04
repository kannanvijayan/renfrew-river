import GameClient, { GameSettings } from "renfrew-river-protocol-client";
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
  private worldObserver_: WorldObserver | null = null;
  private surface_: GameSurface | null = null;

  public constructor(args: {
    client: GameClient,
    serverSession: GameServerSession,
    settings: GameSettings,
  }) {
    this.client_ = args.client;
    this.serverSession = args.serverSession;
    this.settings = args.settings;

    const worldDims = this.settings.worldDims;
    const miniColumns = 500;
    const miniRows = 0|(worldDims.rows * miniColumns / worldDims.columns);

    this.world_ = new GameWorld({
      constants: this.serverSession.constants,
      worldDims: this.settings.worldDims,
      miniDims: { columns: miniColumns, rows: miniRows },
      loaderApi: {
        readMapArea: async ({topLeft, area}) => {
          const result = await this.client_.readMapData({
            topLeft,
            area,
            kinds: ["Elevation", "AnimalId"] as ["Elevation", "AnimalId"],
          });
          // TODO: assert(result.elevations !== null);
          console.debug("KVKV readMapArea result", result);
          const { elevations, animalIds } = result;
          return { elevations, animalIds };
        },
      },
    });
  }

  public handleCanvasMounted(canvas: HTMLCanvasElement): void {
    console.log("KVKV Canvas mounted", canvas);
    // Mounted the same canvas.
    if (this.surface_?.matchesCanvas(canvas)) {
      console.log("KVKV Canvas already mounted");
      return;
    }


    // Destroy the old surface.
    if (this.surface_) {
      this.surface_.destroy();
    }

    this.worldObserver_ = new WorldObserver({ world: this.world_ })

    this.surface_ = new GameSurface({
      canvas,
      worldObserver: this.worldObserver_,
      callbackApi: {
        "ensureMapDataLoaded": async (topleft, area) => {
          return this.world_.ensureViewAndQueueSurroundings(topleft, area);
        },
        "getAnimalData": async (animalId) => {
          return this.client_.getAnimalData(animalId);
        },
        "getCellInfo": async (cell) => {
          return this.client_.getCellInfo(cell);
        },
        "takeTurnStep": async () => {
          const result = await this.client_.takeTurnStep();
          console.log("KVKV takeTurnStep result", result);
        },
      }
    });
  }

  public handleCanvasUnmounted(canvas: HTMLCanvasElement): void {
    console.log("KVKV Canvas unmounted", canvas);
    if (this.surface_) {
      if (! this.surface_.matchesCanvas(canvas)) {
        console.error("KVKV Canvas does not match on unmount");
      }
      this.surface_.destroy();
      this.surface_ = null;
      this.worldObserver_ = null;
    }
  }
}
