import { CellCoord } from "./types/cell_coord";
import { Constants } from "../client/protocol/types/constants";
import { AnimalData } from "./types/animal_data";
import { WorldDims } from "./types/world_dims";
import GameWorldElevations from "./world_elevations";
import GameWorldElevationsTiled from "./world_elevations_tiled";
import GameWorldObserver from "./world_observer";

export type GameWorldLoaderApi = {
  readElevations: (opts: {
    topLeft: CellCoord,
    area: WorldDims
  }) => Promise<number[][]>,
};

/** The game world. */
export default class GameWorld {
  public readonly worldDims: WorldDims;
  public readonly miniDims: WorldDims;
  public readonly elevations: GameWorldElevationsTiled;
  public readonly miniElevations: GameWorldElevations;
  public readonly animals: AnimalData[];

  constructor(opts: {
    constants: Constants,
    worldDims: WorldDims,
    miniDims: WorldDims,
    loaderApi: GameWorldLoaderApi,
  }) {
    const { constants, worldDims, miniDims, loaderApi } = opts;
    this.worldDims = worldDims;
    this.miniDims = miniDims;
    this.elevations = new GameWorldElevationsTiled({
      constants,
      worldDims,
      loaderApi,
    });
    this.miniElevations = new GameWorldElevations({
      constants,
      worldDims: miniDims,
    });
    this.animals = [];
  }

  public newObserver(): GameWorldObserver {
    return new GameWorldObserver({ world: this });
  }

  public addAnimals(animals: AnimalData[]): void {
    for (const animal of animals) {
      this.animals.push(animal);
    }
  }
}