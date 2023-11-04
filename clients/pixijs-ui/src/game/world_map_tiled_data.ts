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

  // To prevent multiple simultaneous load requests in flight.
  private isTileLoadInProgress: boolean;

  // To handle invalidations.
  private generation: number;
  private invalidationListeners: (() => void)[];

  constructor(opts: {
    constants: Constants,
    worldDims: WorldDims,
    loaderApi: WorldMapTiledDataCallbackApi,
  }) {
    const { worldDims, constants, loaderApi } = opts;

    this.constants = constants;
    this.worldDims = worldDims;
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
    this.generation = 0;
    this.invalidationListeners = [];
  }

  public async ensureViewAndQueueSurroundings(
    topLeft: CellCoord,
    area: WorldDims,
  ): Promise<{
    tilesUpdated: number,
    tilesInvalidated: number,
    surroundingsLoaded: Promise<{
      tilesUpdated: number,
      tilesInvalidated: number,
    }>
  }> {
    this.demoteExistingHighPriorityLoads();

    // Wait only until the immediate view is loaded, and then return.
    // But in the background, load the surrounding tiles.
    const { tlTileColumn, tlTileRow, brTileColumn, brTileRow } =
      this.computeTileCoverage(topLeft, area);

    const viewLoadIndexes = [];
    for (let i = tlTileColumn; i <= brTileColumn; i++) {
      for (let j = tlTileRow; j <= brTileRow; j++) {
        const tileIndex = this.tileIndex(i, j);
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

    let tilesUpdated = 0;
    let tilesInvalidated = 0;
    if (viewLoadIndexes.length > 0) {
      const viewLoadWatcher = new TileLoadWatcher(viewLoadIndexes);
      for (const tileIndex of viewLoadIndexes) {
        this.loadTile(tileIndex, "high", viewLoadWatcher)
      }
      const { updated, invalidated } = await viewLoadWatcher.waitForCompletion();
      tilesUpdated += updated;
      tilesInvalidated += invalidated;
    }

    // Load the surrounding tiles in the background.
    const surroundingsLoadedPromise = (async () => {

      const surroundingLoadIndexes = [];
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
          const tileIndex = this.tileIndex(i, j);
          // Don't create load promises for tiles that are already loaded.
          if (this.tileLoadStates[tileIndex] === "Loaded") {
            continue;
          }
          surroundingLoadIndexes.push(tileIndex);
        }
      }

      let surroundingTilesUpdated = 0;
      let surroundingTilesInvalidated = 0;
      if (surroundingLoadIndexes.length > 0) {
        const surroundingLoadWatcher =
          new TileLoadWatcher(surroundingLoadIndexes);
        for (const tileIndex of surroundingLoadIndexes) {
          this.loadTile(tileIndex, "low", surroundingLoadWatcher)
        }
        const { updated, invalidated } =
          await surroundingLoadWatcher.waitForCompletion();
        surroundingTilesUpdated += updated;
        surroundingTilesInvalidated += invalidated;
      }

      return {
        tilesUpdated: surroundingTilesUpdated,
        tilesInvalidated: surroundingTilesInvalidated
      };
    })();

    return {
      tilesUpdated,
      tilesInvalidated,
      surroundingsLoaded: surroundingsLoadedPromise,
    };
  }

  public invalidate() {
    // Reset the tile load states.
    this.tileLoadStates.fill("NotLoaded");

    // We don't need to clear out the request queues since requests
    // dispatched after the invalidation will get the latest map data.
    // However, we should increment the generation so that any in-flight
    // requests will know that they are stale and not bother writing-back
    // the map-data they receive, or updating the tile status to loaded.
    // This is checked in `performTileLoad` below.
    this.generation++;

    for (const listener of this.invalidationListeners) {
      listener();
    }
  }

  public addInvalidationListener(listener: () => void): void {
    this.invalidationListeners.push(listener);
  }

  public removeInvalidationListener(listener: () => void): void {
    const index = this.invalidationListeners.indexOf(listener);
    if (index === -1) {
      throw new Error("WorldElevationsTiled.removeInvalidationListener: listener not found");
    }
    this.invalidationListeners.splice(index, 1);
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
      tileLoadRequest = new TileLoadRequest({
        tileIndex,
        priority,
        watcher,
        generation: this.generation,
      });
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
        // ASSERT: !highPriorityLoadRequest.isComplete()
        this.dispatchLoadRequest(highPriorityLoadRequest);
        continue;
      }

      const lowPriorityLoadRequest = this.lowPriorityTileLoadQueue.pop();
      if (lowPriorityLoadRequest) {
        // A low-priority load request may have been completed before we
        // get to it because it got added to the high-priority queue as well.
        if (lowPriorityLoadRequest.isComplete()) {
          continue;
        }
        this.dispatchLoadRequest(lowPriorityLoadRequest);
        continue;
      }
    }
    this.isTileLoadInProgress = false;
  }

  private async dispatchLoadRequest(request: TileLoadRequest) {
    // ASSERT: !request.isComplete()
    const loadCompletion = await this.performTileLoad(
      request.tileIndex,
      this.generation
    );
    request.notifyCompleted(loadCompletion);
  }

  private async performTileLoad(
    tileIndex: number,
    generation: number
  ): Promise<TileLoadCompletion> {
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

    // If the generation has changed since the request was made, then
    // the data is stale and we should not write it.
    if (generation !== this.generation) {
      return "invalidated";
    }

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

    return "updated";
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

type TileLoadCompletion = "updated" | "invalidated";

class TileLoadRequest {
  readonly tileIndex: number;
  priority: "high" | "low";
  private complete: boolean;
  private readonly watchers: TileLoadWatcher[];

  constructor(args: {
    tileIndex: number,
    priority: "high" | "low",
    watcher: TileLoadWatcher,
    generation: number,
  }) {
    this.tileIndex = args.tileIndex;
    this.priority = args.priority;
    this.complete = false;
    this.watchers = [args.watcher];
  }

  notifyCompleted(completion: TileLoadCompletion): void {
    this.complete = true;
    for (const watcher of this.watchers) {
      watcher.notifyWatchedTileCompleted(this.tileIndex, completion);
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
  private readonly deferred: Deferred<{ updated: number, invalidated: number }>;

  // The number of tiles updated / invalidated
  private tilesUpdated: number;
  private tilesInvalidated: number;

  constructor(indexesWatched: number[]) {
    this.indexesWatched = new Set(indexesWatched);
    this.deferred = new Deferred();
    this.tilesUpdated = 0;
    this.tilesInvalidated = 0;
  }

  notifyWatchedTileCompleted(
    tileIndex: number,
    completion: TileLoadCompletion,
  ): void {
    switch (completion) {
      case "updated":
        this.tilesUpdated++;
        break;
      case "invalidated":
        this.tilesInvalidated++;
        break;
    }
    this.indexesWatched.delete(tileIndex);
    if (this.indexesWatched.size === 0) {
      this.deferred.resolvePromise({
        updated: this.tilesUpdated,
        invalidated: this.tilesInvalidated,
      });
    }
  }

  waitForCompletion(): Promise<{ updated: number, invalidated: number }> {
    return this.deferred.getPromise();
  }
}