import GameClient, {
  CellCoord,
  GameConstants,
  AnimalData,
  WorldDims
} from "renfrew-river-protocol-client";
import WorldMapTiledData, { WorldMapTiledDataLoadResult } from "./world_map_tiled_data";
import WorldObserver from "./world_observer";
import WorldMinimapData from "./world_minimap_data";

/** The game world. */
export default class GameWorld {
  public readonly worldDims: WorldDims;
  public readonly miniDims: WorldDims;
  public readonly mapData: WorldMapTiledData;
  public readonly minimapData: WorldMinimapData;
  public readonly animals: AnimalData[];

  private constructor(opts: {
    client: GameClient,
    constants: GameConstants,
    worldDims: WorldDims,
    miniDims: WorldDims,
    minimapData: WorldMinimapData,
  }) {
    const { client, constants, worldDims, miniDims } = opts;
    this.worldDims = worldDims;
    this.miniDims = miniDims;
    this.mapData = new WorldMapTiledData({
      client,
      constants,
      worldDims,
    });
    this.animals = [];
    this.minimapData = opts.minimapData;
  }

  public static async load(opts: {
    client: GameClient,
    constants: GameConstants,
    worldDims: WorldDims,
    miniDims: WorldDims,
  }): Promise<GameWorld> {
    const { client, constants, worldDims, miniDims } = opts;
    const minimapData = await WorldMinimapData.load(
      { client, constants, miniDims }
    );
    return new GameWorld(
      { client, constants, worldDims, miniDims, minimapData }
    );
  }

  public invalidateMapData(): void {
    this.mapData.invalidate();
  }

  public newObserver(): WorldObserver {
    return new WorldObserver(this);
  }

  public addAnimals(animals: AnimalData[]): void {
    for (const animal of animals) {
      this.animals.push(animal);
    }
  }

  public async ensureViewAndQueueSurroundings(
    topLeft: CellCoord,
    area: WorldDims,
  ): Promise<WorldMapTiledDataLoadResult> {
    return this.mapData.ensureViewAndQueueSurroundings(topLeft, area);
  }
}
