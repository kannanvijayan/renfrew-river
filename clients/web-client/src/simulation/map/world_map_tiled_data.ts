import {
  CellCoord,
  GenerationCellDatumId,
  WorldDims
} from "renfrew-river-protocol-client";
import Deferred from "../../util/deferred";
import MapData, { ReadMapDataCallback } from "./map_data";
import MapDataSet from "./map_dataset";

export type WorldMapTiledDataLoadResult = {
  tilesUpdated: number,
  tilesInvalidated: number,
  surroundingsLoaded: Promise<{
    tilesUpdated: number,
    tilesInvalidated: number,
  }>,
};

const PER_TILE_DIMS: WorldDims = { columns: 64, rows: 64 };

/**
 * World elevations, but with support for dynamically loading them
 * from the server.
 * 
 * This is done by splitting the world into tiles, and loading each
 * tile as needed.
 */
export default class WorldMapTiledData {
  private readonly readMapDataCallback: ReadMapDataCallback;
  public readonly worldDims: WorldDims;
  public readonly mapDataSet: MapDataSet;

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
  private readonly invalidationListeners: (() => void)[];

  public constructor(opts: {
    readMapData: ReadMapDataCallback,
    worldDims: WorldDims,
  }) {
    const { readMapData, worldDims } = opts;
    this.readMapDataCallback = readMapData;
    this.worldDims = worldDims;
    this.mapDataSet = new MapDataSet(this.worldDims);

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

  public setObservedDatumIds(datumIds: GenerationCellDatumId[]): void {
    this.mapDataSet.setObservedDatumIds(datumIds);
    this.invalidate();
  }
  
  public setVisualizedDatumId(index: number, datumIndex: number): void {
    const updated = this.mapDataSet.setVisualizedDatumId(index, datumIndex);
    if (updated === "updated") {
      this.mapDataSet.reinjectTextureData();
    }
  } 

  public getTextureSource(): MapData<"float32", 4> {
    return this.mapDataSet.getTextureSource();
  }

  public addTextureUpdateListener(listener: () => void): () => void {
    return this.mapDataSet.addTextureUpdateListener(listener);
  }

  public async ensureViewAndQueueSurroundings(
    topLeft: CellCoord,
    dims: WorldDims,
  ): Promise<WorldMapTiledDataLoadResult> {
    this.demoteExistingHighPriorityLoads();

    // Wait only until the immediate view is loaded, and then return.
    // But in the background, load the surrounding tiles.
    const { tlTileColumn, tlTileRow, brTileColumn, brTileRow } =
      this.computeTileCoverage(topLeft, dims);

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

  public addInvalidationListener(listener: () => void): () => void {
    this.invalidationListeners.push(listener);
    return () => this.removeInvalidationListener(listener);
  }

  private removeInvalidationListener(listener: () => void): void {
    const index = this.invalidationListeners.indexOf(listener);
    if (index < 0) {
      console.error("WorldElevationsTiled.removeInvalidationListener: listener not found");
      return;
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
    const dims: WorldDims = {
      columns: Math.min(
        this.worldDims.columns - topLeft.col,
        PER_TILE_DIMS.columns
      ),
      rows: Math.min(
        this.worldDims.rows - topLeft.row,
        PER_TILE_DIMS.rows
      ),
    };
    const mapDataUpdates = await this.readMapData(topLeft, dims);
    if (mapDataUpdates.length === 0) {
      this.tileLoadStates[tileIndex] = "Loaded";
      return "updated";
    }

    // If the generation has changed since the request was made, then
    // the data is stale and we should not write it.
    if (generation !== this.generation) {
      return "invalidated";
    }

    for (const [datumId, updateData] of mapDataUpdates) {
      this.mapDataSet.updateMapData({
        datumId,
        dstTopLeft: topLeft,
        src: updateData,
      });
    }

    this.tileLoadStates[tileIndex] = "Loaded";

    return "updated";
  }

  private async readMapData(topLeft: CellCoord, dims: WorldDims)
    : Promise<[GenerationCellDatumId, MapData<"uint32", 1>][]>
  {
    const datumIds = this.mapDataSet.getObservedDatumIds();
    if (datumIds.length === 0) {
      return [];
    }
    const result = await this.readMapDataCallback({ topLeft, dims, datumIds });
    return result.map((mapData, i) => [datumIds[i], mapData]);
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

  private computeTileCoverage(topLeft: CellCoord, dims: WorldDims)
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
      (topLeft.col + dims.columns) / PER_TILE_DIMS.columns
    );
    const brTileRow = Math.floor(
      (topLeft.row + dims.rows) / PER_TILE_DIMS.rows
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
