import { CellCoord } from "./types/cell_coord";
import { Constants } from "../client/protocol/types/constants";
import { WorldDims } from "./types/world_dims";
import Deferred from "../util/deferred";
import MapData from "./map_data";
import { INVALID_ANIMAL_ID } from "./types/animal_data";

export type WorldMapTiledDataCallbackApi = {
  readMapArea: (opts: {
    topLeft: CellCoord,
    area: WorldDims
  }) => Promise<{
    elevations: number[][],
    animalIds: number[][],
  }>,
};

const PER_TILE_DIMS: WorldDims = { columns: 256, rows: 256 };

/**
 * World elevations, but with support for dynamically loading them
 * from the server.
 * 
 * This is done by splitting the world into tiles, and loading each
 * tile as needed.
 */
export default class WorldMapTiledData {
  public readonly constants: Constants;
  public readonly worldDims: WorldDims;
  public readonly elevations: MapData<"uint8">;
  public readonly animalKinds: MapData<"uint8">;

  private readonly loaderApi: WorldMapTiledDataCallbackApi;
  private readonly totalTileRows: number;
  private readonly totalTileColumns: number;

  // This is a 1D array, indexed by tileRow * totalTileColumns + tileColumn.
  private readonly tileLoadStates: TileLoadState[];

  private readonly highPriorityTileLoadQueue: TileLoadRequest[];
  private readonly lowPriorityTileLoadQueue: TileLoadRequest[];

  private isTileLoadInProgress: boolean;

  constructor(opts: {
    constants: Constants,
    worldDims: WorldDims,
    loaderApi: WorldMapTiledDataCallbackApi,
  }) {
    let { worldDims, constants, loaderApi } = opts;

    this.constants = opts.constants;
    this.worldDims = opts.worldDims;
    this.elevations = new MapData("uint8", this.worldDims);
    this.animalKinds = new MapData("uint8", this.worldDims);

    this.loaderApi = loaderApi;

    this.totalTileRows = Math.ceil(this.worldDims.rows / PER_TILE_DIMS.rows);
    this.totalTileColumns =
      Math.ceil(this.worldDims.columns / PER_TILE_DIMS.columns);

    this.tileLoadStates =
      new Array(this.totalTileRows * this.totalTileColumns).fill("NotLoaded");
    this.highPriorityTileLoadQueue = [];
    this.lowPriorityTileLoadQueue = [];

    this.isTileLoadInProgress = false;
  }

  public async ensureViewAndQueueSurroundings(
    topLeft: CellCoord,
    area: WorldDims,
  ): Promise<{
       newTilesWritten: boolean,
       surroundingsLoaded: Promise<{ newTilesWritten: boolean }>
     }>
  {
    this.demoteExistingHighPriorityLoads();

    // Wait only until the immediate view is loaded, and then return.
    // But in the background, load the surrounding tiles.
    const { tlTileColumn, tlTileRow, brTileColumn, brTileRow } =
      this.computeTileCoverage(topLeft, area);

    const viewLoadIndexes = [];
    for (let i = tlTileColumn; i <= brTileColumn; i++) {
      for (let j = tlTileRow; j <= brTileRow; j++) {
        let tileIndex = this.tileIndex(i, j);
        // Early skip if tile is already loaded.  Avoids creating
        // unnecessary promises.
        if (this.tileLoadStates[tileIndex] === "Loaded") {
          continue;
        }
        viewLoadIndexes.push(tileIndex);
      }
    }
    if (viewLoadIndexes.length > 0) {
      console.log("ensureViewAndQueueSurroundings viewLoadIndexes", viewLoadIndexes);
    } else {
      console.log("ensureViewAndQueueSurroundings viewLoadIndexes=[]");
    }

    let newViewTilesWritten = false;
    if (viewLoadIndexes.length > 0) {
      const viewLoadWatcher = new TileLoadWatcher(viewLoadIndexes);
      for (let tileIndex of viewLoadIndexes) {
        this.loadTile(tileIndex, "high", viewLoadWatcher)
      }
      newViewTilesWritten = true;
      await viewLoadWatcher.waitForCompletion();
    }

    // Load the surrounding tiles in the background.
    const surroundingsLoadedPromise = (async () => {

      let surroundingLoadIndexes = [];
      for (let i = tlTileColumn - 1; i <= brTileColumn + 1; i++) {
        for (let j = tlTileRow - 1; j <= brTileRow + 1; j++) {
          // Don't load the immediate view again.
          if (
            i >= tlTileColumn && i <= brTileColumn &&
            j >= tlTileRow && j <= brTileRow
          ) {
            continue;
          }
          // Don't load tiles that are outside the world.
          if (
            i < 0 || i >= this.totalTileColumns ||
            j < 0 || j >= this.totalTileRows
          ) {
            continue;
          }
          let tileIndex = this.tileIndex(i, j);
          // Don't create load promises for tiles that are already loaded.
          if (this.tileLoadStates[tileIndex] === "Loaded") {
            continue;
          }
          surroundingLoadIndexes.push(tileIndex);
        }
      }

      let newSurroundingTilesWritten = false;
      if (surroundingLoadIndexes.length > 0) {
        const surroundingLoadWatcher =
          new TileLoadWatcher(surroundingLoadIndexes);
        for (let tileIndex of surroundingLoadIndexes) {
          this.loadTile(tileIndex, "low", surroundingLoadWatcher)
        }
        newSurroundingTilesWritten = true;
        await surroundingLoadWatcher.waitForCompletion();
      }

      return { newTilesWritten: newSurroundingTilesWritten };
    })();

    return {
      newTilesWritten: newViewTilesWritten,
      surroundingsLoaded: surroundingsLoadedPromise,
    };
  }

  private demoteExistingHighPriorityLoads(): void {
    // Demote existing high-priority loads to low-priority.
    for (const highPriorityLoadRequest of this.highPriorityTileLoadQueue) {
      highPriorityLoadRequest.priority = "low";
      this.lowPriorityTileLoadQueue.push(highPriorityLoadRequest);
    }
    this.highPriorityTileLoadQueue.length = 0;
  }

  private loadTile(
    tileIndex: number,
    priority: "high" | "low",
    watcher: TileLoadWatcher,
  ): void {
    const loadState = this.tileLoadStates[tileIndex];

    // If tile is already loaded, return.
    if (loadState === "Loaded") {
      // Should not be the case.
      console.warn("WorldElevationsTiled.loadTile called on loaded tile");
      return;
    }

    // Otherwise, add a watcher to the tile load request for it.
    let tileLoadRequest: TileLoadRequest;
    let freshLoadRequest: boolean;
    if (loadState === "NotLoaded") {
      tileLoadRequest = new TileLoadRequest(tileIndex, priority, watcher);
      this.tileLoadStates[tileIndex] = tileLoadRequest;
      freshLoadRequest = true;
    } else {
      tileLoadRequest = loadState;
      tileLoadRequest.addWatcher(watcher);
      freshLoadRequest = false;
    }

    if (priority === "low") {
      if (freshLoadRequest) {
        this.lowPriorityTileLoadQueue.push(tileLoadRequest);
        this.maybeBeginLoadingTiles();
      }
      // For low-priority loads, if the request already existed, then
      // it's already part of one of the load queues, and loading is
      // in process.  Nothing more to do.

      // ASSERT: this.isLoadInProgress
      return;
    }

    // High-priority load.

    // If this is a freshly made request, add it to the high-priority
    // queue, start loading if needed, and return.
    if (freshLoadRequest) {
      this.highPriorityTileLoadQueue.push(tileLoadRequest);
      this.maybeBeginLoadingTiles();
      return;
    }


    // High-priority load, pre-existing request.

    // ASSERT: this.isLoadInProgress

    // If this is a pre-existing request, but it was low-priority,
    // then change it to high-priority and add it to the high-priority
    // queue.
    if (tileLoadRequest.priority === "low") {
      tileLoadRequest.priority = "high";
      this.highPriorityTileLoadQueue.push(tileLoadRequest);
      return;
    }

    // High-priority load, pre-existing request, already high-priority.
    // Nothing to do.
  }

  private async maybeBeginLoadingTiles() {
    if (this.isTileLoadInProgress) {
      return;
    }
    this.isTileLoadInProgress = true;
    while (
      this.highPriorityTileLoadQueue.length > 0 ||
      this.lowPriorityTileLoadQueue.length > 0
    ) {
      const highPriorityLoadRequest = this.highPriorityTileLoadQueue.pop();
      if (highPriorityLoadRequest) {
        // ASSERT: !highPriorityLoadRequest.complete
        await this.performTileLoad(highPriorityLoadRequest.tileIndex);
        highPriorityLoadRequest.notifyCompleted();
        continue;
      }

      const lowPriorityLoadRequest = this.lowPriorityTileLoadQueue.pop();
      if (lowPriorityLoadRequest) {
        // A low-priority load request may have been completed before we
        // get to it because it got added to the high-priority queue as well.
        if (lowPriorityLoadRequest.isComplete()) {
          continue;
        }
        await this.performTileLoad(lowPriorityLoadRequest.tileIndex);
        lowPriorityLoadRequest.notifyCompleted();
        continue;
      }
    }
    this.isTileLoadInProgress = false;
  }

  private async performTileLoad(tileIndex: number): Promise<void> {
    const { tileColumn, tileRow } = this.tileColumnAndRow(tileIndex);
    // Get or create a tile load request.
    const topLeft: CellCoord = {
      col: tileColumn * PER_TILE_DIMS.columns,
      row: tileRow * PER_TILE_DIMS.rows,
    };
    const area: WorldDims = {
      columns: Math.min(
        this.worldDims.columns - topLeft.col,
        PER_TILE_DIMS.columns
      ),
      rows: Math.min(
        this.worldDims.rows - topLeft.row,
        PER_TILE_DIMS.rows
      ),
    };
    const areaData = await this.loaderApi.readMapArea({ topLeft, area });
    const shift_bits = this.constants.elevation_bits - 8;
    this.elevations.write2D({
      topLeft,
      area,
      genValue: (x, y) => (areaData.elevations[y][x] >> shift_bits),
    });
    console.log("performTileLoad animalIds", areaData.animalIds);
    this.animalKinds.write2D({
      topLeft,
      area,
      genValue: (x, y) => (areaData.animalIds[y][x] == INVALID_ANIMAL_ID ? 0 : 1),
    });
    this.tileLoadStates[tileIndex] = "Loaded";
  }

  private tileIndex(tileColumn: number, tileRow: number): number {
    return tileRow * this.totalTileColumns + tileColumn;
  }
  private tileColumnAndRow(tileIndex: number)
    : { tileColumn: number, tileRow: number }
  {
    return {
      tileColumn: tileIndex % this.totalTileColumns,
      tileRow: Math.floor(tileIndex / this.totalTileColumns),
    };
  }

  private computeTileCoverage(topLeft: CellCoord, area: WorldDims)
    : {
        tlTileColumn: number,
        tlTileRow: number,
        brTileColumn: number,
        brTileRow: number,
      }
  {
    const tlTileColumn = Math.floor(topLeft.col / PER_TILE_DIMS.columns);
    const tlTileRow = Math.floor(topLeft.row / PER_TILE_DIMS.rows);

    const brTileColumn = Math.floor(
      (topLeft.col + area.columns) / PER_TILE_DIMS.columns
    );
    const brTileRow = Math.floor(
      (topLeft.row + area.rows) / PER_TILE_DIMS.rows
    );

    return { tlTileColumn, tlTileRow, brTileColumn, brTileRow };
  }
}

type TileLoadState =
  | "NotLoaded"       // Not loaded and no request to load yet.
  | "Loaded"          // Already loaded.
  | TileLoadRequest;  // Has request to load.


class TileLoadRequest {
  readonly tileIndex: number;
  priority: "high" | "low";
  private complete: boolean;
  private readonly watchers: TileLoadWatcher[];

  constructor(
    tileIndex: number,
    priority: "high" | "low",
    watcher: TileLoadWatcher
  ) {
    this.tileIndex = tileIndex;
    this.priority = priority;
    this.complete = false;
    this.watchers = [watcher];
  }

  notifyCompleted(): void {
    this.complete = true;
    for (let watcher of this.watchers) {
      watcher.notifyWatchedTileCompleted(this.tileIndex);
    }
  }

  addWatcher(watcher: TileLoadWatcher): void {
    this.watchers.push(watcher);
  }

  isComplete(): boolean {
    return this.complete;
  }
}

class TileLoadWatcher {
  // All the tiles and columns this watcher is waiting to load.
  // This is cleared as tiles com in.
  private readonly indexesWatched: Set<number>;

  // The deferred to resolve when all tiles are loaded.
  private readonly deferred: Deferred<void>;

  constructor(indexesWatched: number[]) {
    this.indexesWatched = new Set(indexesWatched);
    this.deferred = new Deferred<void>();
  }

  notifyWatchedTileCompleted(tileIndex: number): void {
    this.indexesWatched.delete(tileIndex);
    if (this.indexesWatched.size === 0) {
      this.deferred.resolvePromise();
    }
  }

  waitForCompletion(): Promise<void> {
    return this.deferred.getPromise();
  }
}