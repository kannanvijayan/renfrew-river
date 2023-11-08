import {
  CellCoord,
  GameConstants,
  AnimalData,
  WorldDims
} from "renfrew-river-protocol-client";
import WorldMapTiledData from "./world_map_tiled_data";
import WorldObserver from "./world_observer";
import WorldMinimapData from "./world_minimap_data";

export type GameWorldLoaderApi = {
  readMapArea: (opts: {
    topLeft: CellCoord,
    area: WorldDims
  }) => Promise<{
    elevations: number[][],
    animalIds: number[][],
  }>;
};

/** The game world. */
export default class GameWorld {
  public readonly worldDims: WorldDims;
  public readonly miniDims: WorldDims;
  public readonly mapData: WorldMapTiledData;
  public readonly minimapData: WorldMinimapData;
  public readonly animals: AnimalData[];

  constructor(opts: {
    constants: GameConstants,
    worldDims: WorldDims,
    miniDims: WorldDims,
    loaderApi: GameWorldLoaderApi,
  }) {
    const { constants, worldDims, miniDims, loaderApi } = opts;
    this.worldDims = worldDims;
    this.miniDims = miniDims;
    this.mapData = new WorldMapTiledData({
      constants,
      worldDims,
      loaderApi,
    });
    this.minimapData = new WorldMinimapData({ constants, miniDims });
    this.animals = [];
  }

  public newObserver(): WorldObserver {
    return new WorldObserver({ world: this });
  }

  public addAnimals(animals: AnimalData[]): void {
    for (const animal of animals) {
      this.animals.push(animal);
    }
  }
}
