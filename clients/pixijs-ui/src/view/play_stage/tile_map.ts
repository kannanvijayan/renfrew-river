import * as PIXI from 'pixi.js';
import {
  NORMAL_SCALE_TILE,
  hexTileUnderNormalOffset,
  normalOffsetXForTileBoundingBox,
  normalOffsetYForTileBoundingBox,
  rectifiedBoundingBoxTileFromNormalOffset,
} from './hex';
import HexMesh from './hex_mesh';
import WorldMapTiledData from '../../game/world_map_tiled_data';
import { CellCoord } from '../../game/types/cell_coord';
import { WorldDims } from '../../game/types/world_dims';

export type TileMapCallbackApi = {
  ensureMapDataLoaded: (
    topleft: CellCoord,
    area: WorldDims,
  ) => Promise<{
    tilesUpdated: number,
    tilesInvalidated: number,
    surroundingsLoaded : Promise<{
      tilesUpdated: number,
      tilesInvalidated: number,
    }>,
  }>,
};

export type TileMapOptions = {
  worldColumns: number;
  worldRows: number;
  areaWidth: number;
  areaHeight: number;
  mapData: WorldMapTiledData;
  callbackApi: TileMapCallbackApi;
};

const MIN_ZOOM_LEVEL = 0.1;

const MESH_SURPLUS = { cols: 4, rows: 4 };

export default class TileMap extends PIXI.Container {
  private readonly worldColumns: number;
  private readonly worldRows: number;
  private readonly mapData: WorldMapTiledData;
  private readonly callbackApi: TileMapCallbackApi;

  private readonly maxWorldX: number;
  private readonly maxWorldY: number;

  // The width and height of the draw area.
  // Adjusted by the resize event.
  areaWidth: number;
  areaHeight: number;

  // The scaling of the world-map by zoom amount.  Maximally 1.
  zoomLevel: number;

  // The number of tile columns and rows in the mesh.
  private meshColumns: number;
  private meshRows: number;

  // The top-left corner of the tile-map, using coordinates normalized
  // to the world map.
  readonly topLeftWorld: PIXI.IPointData;

  // The top left world column and row.  This is not the top left
  // of the visual area, but the top left of the rendered mesh, which
  // may be off screen.
  private topLeftWorldColumn: number;
  private topLeftWorldRow: number;

  // The top left corner of the tile-map, using pixel coordinates.
  // Assuming a 100x100 pixel square for each tile.
  private readonly topLeftMesh: PIXI.IPointData;

  // Whether we're starting a drag.
  private startingDrag: boolean;

  // The worldTopLeft when the drag started.
  private startDragTopLeftWorld: Readonly<PIXI.IPointData> | undefined;

  // The screen point where the drag started.
  private startDragPoint: Readonly<PIXI.IPointData> | undefined;

  // Whether the tile-map is being dragged.
  private beingDragged: boolean;

  // The hover point.
  private hoverPoint: PIXI.IPointData | undefined;

  // The cell coordinate of the hover point.
  private hoverCellCoord: CellCoord | undefined;

  // The PIXI mesh object.
  private hexMesh: HexMesh;

  // Observer of the tilemap.
  private readonly observer: TileMapObserver;

  // Commander of the tilemap.
  private readonly commander: TileMapCommander;

  // Update counter, incremented every time `updateMeshPosition` is called.
  // This helps ensure that quick successive calls to `updateMeshPosition`
  // don't cause the prior call to proceed using the attributes written by
  // the later call.
  private updateCounter: number;

  constructor(opts: Readonly<TileMapOptions>) {
    super();
    this.worldColumns = opts.worldColumns;
    this.worldRows = opts.worldRows;
    this.mapData = opts.mapData;
    this.callbackApi = opts.callbackApi;

    this.maxWorldX = (
      normalOffsetXForTileBoundingBox(this.worldColumns - 1, 0) +
      NORMAL_SCALE_TILE.width / 2
    );
    this.maxWorldY = (
      normalOffsetYForTileBoundingBox(0, this.worldRows - 1) +
      NORMAL_SCALE_TILE.height / 2
    );

    this.areaWidth = opts.areaWidth;
    this.areaHeight = opts.areaHeight;

    this.zoomLevel = 0.5;

    this.meshColumns = this.meshColumnsForAreaWidth(this.areaWidth);
    this.meshRows = this.meshRowsForAreaHeight(this.areaHeight);

    this.topLeftWorld = new PIXI.Point(
      NORMAL_SCALE_TILE.width / 2,
      NORMAL_SCALE_TILE.height / 2,
    );
    this.topLeftWorldColumn = 0;
    this.topLeftWorldRow = 0;
    this.topLeftMesh = new PIXI.Point(
      NORMAL_SCALE_TILE.width / 2,
      NORMAL_SCALE_TILE.height / 2
    );

    this.startingDrag = false;
    this.startDragTopLeftWorld = undefined;
    this.startDragPoint = undefined;
    this.beingDragged = false;

    this.hexMesh = new HexMesh({
      columns: this.meshColumns,
      rows: this.meshRows,
      worldColumns: this.worldColumns,
      worldRows: this.worldRows,
      mapData: this.mapData,
      topLeftWorldColumn: this.topLeftWorldColumn,
      topLeftWorldRow: this.topLeftWorldRow,
    });

    this.observer = new TileMapObserver(this);
    this.commander = new TileMapCommander(this);
    this.updateCounter = 0;

    this.updateMeshPosition().then(() => {
      this.addChild(this.hexMesh.mesh);
    });
  }

  public getObserver(): TileMapObserver {
    return this.observer;
  }
  public getCommander(): TileMapCommander {
    return this.commander;
  }

  public centerOnNormalScaleWorldPoint(
    point: Readonly<PIXI.IPointData>
  ): void {
    const newTopLeftWorldX = 
      point.x - ((this.areaWidth / 2) / this.clampedZoomLevel());
    const newTopLeftWorldY =
      point.y - ((this.areaHeight / 2) / this.clampedZoomLevel());
    this.setTopLeftWorld(newTopLeftWorldX, newTopLeftWorldY);
    this.updateMeshPosition();
  }

  public updateTime(_time: number): void {
    // For animated sprites, update time in shader here.
  }

  public handlePointerDown(point: Readonly<PIXI.IPointData>): void {
    this.dragStart(point);
  }

  public handlePointerUp(point: Readonly<PIXI.IPointData>): void {
    this.checkDragStop(point);
  }

  public handlePointerMove(point: Readonly<PIXI.IPointData>): void {
    this.checkHoverMove(point);
    this.checkDragMove(point);
  }

  public handleWheel(deltaY: number, point: Readonly<PIXI.IPointData>): void {
    // Every adjustment of 100 pixels is a 10% (0.1) zoom.
    // Scroll up (negative deltaY) is a zoom in (adjust zoom up)
    // Scroll down (positive deltaY) is a zoom out (adjust zoom down)
    const newZoomUnclamped = this.zoomLevel - (deltaY / 1000);
    this.adjustZoom(newZoomUnclamped, point);
  }

  public handleResize(width: number, height: number): void {
    this.areaWidth = width;
    this.areaHeight = height;

    this.maybeRecreateMesh();
    this.updateMeshPosition();
  }

  public handleMapInvalidated(): void {
    console.log("Map invalidated");
    this.updateMeshPosition();
  }

  private dragStart(point: Readonly<PIXI.IPointData>): void {
    // Don't do anything if in the middle of drag action.
    if (this.startingDrag || this.beingDragged) {
      return;
    }

    // Set startingDrag to true.
    this.startingDrag = true;
    this.startDragTopLeftWorld = {...this.topLeftWorld};
    this.startDragPoint = {...point};
  }

  private checkDragStop(_point: Readonly<PIXI.IPointData>): boolean {
    if (this.beingDragged || this.startingDrag) {
      this.startDragTopLeftWorld = undefined;
      this.startDragPoint = undefined;
    }

    if (this.beingDragged) {
      this.beingDragged = false;
      return true;
    }

    if (this.startingDrag) {
      this.startingDrag = false;
      return false;
    }

    return false;
  }

  private checkDragMove(point: Readonly<PIXI.IPointData>): void {
    if (this.startingDrag) {
      this.startingDrag = false;
      this.beingDragged = true;
    }

    if (!this.beingDragged) {
      return;
    }

    const startDragPoint = this.startDragPoint!;
    const startDragTopLeftWorld = this.startDragTopLeftWorld!;

    const zoom = this.clampedZoomLevel();

    const offsetX = (point.x - startDragPoint.x) / zoom;
    const offsetY = (point.y - startDragPoint.y) / zoom;

    const topLeftWorldX = startDragTopLeftWorld.x - offsetX;
    const topLeftWorldY = startDragTopLeftWorld.y - offsetY;
    this.setTopLeftWorld(topLeftWorldX, topLeftWorldY);

    this.updateMeshPosition();
  }

  private checkHoverMove(point: Readonly<PIXI.IPointData>): void {
    if (this.startingDrag || this.beingDragged) {
      return;
    }

    // Set hover point, but only allocate a new one when necessary.
    if (this.hoverPoint) {
      this.hoverPoint.x = point.x;
      this.hoverPoint.y = point.y;
    } else {
      this.hoverPoint = {...point};
    }

    // Compute the cell coordinate of the hover point.
    const zoom = this.clampedZoomLevel();
    const worldX = this.topLeftWorld.x + (point.x / zoom);
    const worldY = this.topLeftWorld.y + (point.y / zoom);
    const { col, row } = hexTileUnderNormalOffset(worldX, worldY);
    if (
      !this.hoverCellCoord ||
      this.hoverCellCoord.col !== col ||
      this.hoverCellCoord.row !== row
    ) {
      if (this.hoverCellCoord) {
        this.hoverCellCoord.col = col;
        this.hoverCellCoord.row = row;
      } else {
        this.hoverCellCoord = { col, row };
      }
      this.observer.invokeHoverCellChangedListeners({...this.hoverCellCoord});
    }
  }

  private adjustZoom(
    newZoomUnclamped: number,
    point: Readonly<PIXI.IPointData>
  ): void {
    const oldZoom = this.clampedZoomLevel();
    this.zoomLevel = newZoomUnclamped;
    const newZoom = this.clampedZoomLevel();

    // Adjust the world topLeftWorld and topLeftMesh to keep the
    // coordinate under the mouse pointer.
    const oldWorldDx = this.topLeftWorld.x + (point.x / oldZoom);
    const oldWorldDy = this.topLeftWorld.y + (point.y / oldZoom);

    const newWorldDx = this.topLeftWorld.x + (point.x / newZoom);
    const newWorldDy = this.topLeftWorld.y + (point.y / newZoom);

    // We want to keep the mesh coordinate (oldWorldDx, oldWorldDy)
    // under the mouse pointer.
    // As it stands, the coordinate under the mouse pointer is
    // (newWorldDx, newWorldDy).
    // We adjust the topLeftWorld and topLeftMesh by the difference
    // between the two to achieve that.
    const dx = oldWorldDx - newWorldDx;
    const dy = oldWorldDy - newWorldDy;
    this.adjustTopLeftWorld(dx, dy);

    this.maybeRecreateMesh();
    this.updateMeshPosition();
  }

  private maybeRecreateMesh(): void {
    const meshColumns = this.meshColumnsForAreaWidth(this.areaWidth);
    const meshRows = this.meshRowsForAreaHeight(this.areaHeight);

    if (meshColumns !== this.meshColumns || meshRows !== this.meshRows) {
      this.meshColumns = meshColumns;
      this.meshRows = meshRows;

      this.removeChild(this.hexMesh.mesh);
      this.hexMesh = new HexMesh({
        columns: meshColumns,
        rows: meshRows,
        worldColumns: this.worldColumns,
        worldRows: this.worldRows,
        mapData: this.mapData,
        topLeftWorldColumn: this.topLeftWorldColumn,
        topLeftWorldRow: this.topLeftWorldRow,
      });
      this.addChild(this.hexMesh.mesh);
    }
  }

  /**
   * Final stage of updating the actual rendered view the user sees.
   */
  private updateMeshPosition(): Promise<void> {
    // This function is split into three stages:
    //   1. Update all the local tracking variables.
    //   2. Ensure that the view is loaded.
    //   3. Update the pixi attributes that actually alters what the user sees.
    //
    // Ensuring that the view is loaded is an async operation, so we need to
    // put the actual pixi updates in a callback after that.

    // STAGE 1: Update local tracking variables.
    this.enforceVisibleBounds();

    // Increment the update counter and remember it.
    const updateCounter = ++this.updateCounter;

    // STAGE 2: Ensure that view is loaded.
    return this.callbackApi.ensureMapDataLoaded(
      { col: this.topLeftWorldColumn, row: this.topLeftWorldRow },
      { columns: this.meshColumns, rows: this.meshRows },
    ).then(async ({ tilesUpdated: immediateTilesUpdated, surroundingsLoaded }) => {
      // If the update counter has changed, then this update is stale.
      // Don't update the mesh position.
      if (updateCounter !== this.updateCounter) {
        return;
      }

      // STAGE 3: Update pixi mesh attributes

      // If there were new tiles written when the view was loaded, then
      // Tell pixi to update the elevations texture in the GPU to reflect
      // the new data.  Don't update the mesh until after the texture
      // update completes.
      if (immediateTilesUpdated > 0) {
        await this.hexMesh.updateTextures();
      }

      const mesh = this.hexMesh.mesh;

      const clampedZoom = this.clampedZoomLevel();
      mesh.scale.set(clampedZoom);
      mesh.x = -this.topLeftMesh.x * clampedZoom;
      mesh.y = -this.topLeftMesh.y * clampedZoom;

      mesh.shader.uniforms.topLeftWorldColumn = this.topLeftWorldColumn;
      mesh.shader.uniforms.topLeftWorldRow = this.topLeftWorldRow;

      // Inform the change listeners registered on the observer.
      this.observer.invokeChangeListeners();

      // Extra: If there were new tiles written after the surroundings were
      // loaded, then make sure to update the elevations texture again.
      // NOTE: We do NOT return this promise, because we don't want to
      // waiters of the `updateMeshPosition`'s promise to wait for this.
      surroundingsLoaded.then(({ tilesUpdated: surroundingTilesUpdated }) => {
        if (surroundingTilesUpdated > 0) {
          this.hexMesh.updateTextures();
        }
      });
    });
  }

  // Ensure that the adjustments above have not placed the mesh
  // out of bounds.  Only called from `updateMeshPosition` as a
  // final adjustment before updating the pixi attributes.
  private enforceVisibleBounds(): void {
    // STAGE 1: Update `topLeftWorld` to be valid.
    const zoom = this.clampedZoomLevel();
    const maxTopRightWorldX = this.maxWorldX - (this.areaWidth / zoom);
    const maxTopRightWorldY = this.maxWorldY - (this.areaHeight / zoom);

    let worldX = this.topLeftWorld.x;
    let worldY = this.topLeftWorld.y;

    if (worldX < NORMAL_SCALE_TILE.width / 2) {
      worldX = NORMAL_SCALE_TILE.width / 2;
    }
    if (worldY < NORMAL_SCALE_TILE.height / 2) {
      worldY = NORMAL_SCALE_TILE.height / 2;
    }

    if (worldX > maxTopRightWorldX) {
      worldX = maxTopRightWorldX;
    }
    if (worldY > maxTopRightWorldY) {
      worldY = maxTopRightWorldY;
    }

    if (worldX !== this.topLeftWorld.x || worldY !== this.topLeftWorld.y) {
      this.setTopLeftWorld(worldX, worldY);
    }

    // STAGE 2: Update `topLeftWorldColumn` and `topLeftWorldRow` to be valid.
    const dx = this.topLeftWorld.x - this.topLeftMesh.x;
    const dy = this.topLeftWorld.y - this.topLeftMesh.y;

    const { col, row } = rectifiedBoundingBoxTileFromNormalOffset(dx, dy);
    this.topLeftWorldColumn = col;
    this.topLeftWorldRow = row;
  }

  private adjustTopLeftWorld(dx: number, dy: number): void {
    this.setTopLeftWorld(this.topLeftWorld.x + dx, this.topLeftWorld.y + dy);
  }

  private setTopLeftWorld(x: number, y: number): void {
    this.topLeftWorld.x = x;
    this.topLeftWorld.y = y;

    const meshOffsetX = (
      (x - (NORMAL_SCALE_TILE.width / 2)) % (2 * NORMAL_SCALE_TILE.mulWidth)
    );
    const meshOffsetY = (
      (y - (NORMAL_SCALE_TILE.height / 2)) % (2 * NORMAL_SCALE_TILE.mulHeight)
    );
    this.topLeftMesh.x = meshOffsetX + (NORMAL_SCALE_TILE.width / 2);
    this.topLeftMesh.y = meshOffsetY + (NORMAL_SCALE_TILE.height / 2);
  }

  private meshColumnsForAreaWidth(areaWidth: number): number {
    const zoomLevel = this.clampedZoomLevel();
    return (
      Math.ceil(areaWidth / (NORMAL_SCALE_TILE.mulWidth * zoomLevel)) +
      MESH_SURPLUS.cols
    );
  }
  private meshRowsForAreaHeight(areaHeight: number): number {
    const zoomLevel = this.clampedZoomLevel();
    return (
      Math.ceil(areaHeight / (NORMAL_SCALE_TILE.mulHeight * zoomLevel)) +
      MESH_SURPLUS.rows
    );
  }

  private clampedZoomLevel(): number {
    if (this.zoomLevel <= MIN_ZOOM_LEVEL) {
      this.zoomLevel = MIN_ZOOM_LEVEL;
      return MIN_ZOOM_LEVEL;
    } else if (this.zoomLevel >= 1) {
      this.zoomLevel = 1;
      return 1;
    } else {
      return Math.floor(this.zoomLevel * 10) / 10;
    }
  }
}

export class TileMapObserver {
  private tileMap: TileMap;
  private changeListeners: Array<TileMapChangeListener>;
  private hoverCellChangedListeners: Array<TileMapHoverCellChangedListener>;

  constructor(tileMap: TileMap) {
    this.tileMap = tileMap;
    this.changeListeners = [];
    this.hoverCellChangedListeners = [];
  }

  public addChangeListener(listener: TileMapChangeListener)
    : RemoveListener<TileMapChangeListener>
  {
    this.changeListeners.push(listener);
    return () => {
      this.changeListeners = this.changeListeners.filter(
        l => l !== listener
      );
      return listener;
    };
  }

  public addHoverCellChangedListener(listener: TileMapHoverCellChangedListener)
    : RemoveListener<TileMapHoverCellChangedListener>
  {
    this.hoverCellChangedListeners.push(listener);
    return () => {
      this.hoverCellChangedListeners = this.hoverCellChangedListeners.filter(
        l => l !== listener
      );
      return listener;
    };
  }

  public invokeChangeListeners(): void {
    this.changeListeners.forEach(listener => {
      listener(this);
    });
  }

  public invokeHoverCellChangedListeners(cell: CellCoord): void {
    this.hoverCellChangedListeners.forEach(listener => {
      listener(cell);
    });
  }

  public topLeftWorld(): PIXI.IPointData {
    return {
      x: this.tileMap.topLeftWorld.x,
      y: this.tileMap.topLeftWorld.y,
    };
  }

  public areaWidth(): number {
    return this.tileMap.areaWidth;
  }
  public areaHeight(): number {
    return this.tileMap.areaHeight;
  }
  public zoomLevel(): number {
    return this.tileMap.zoomLevel;
  }
}

export type RemoveListener<T> = () => T;

export type TileMapChangeListener =
  (tileMapObserver: TileMapObserver) => void;

export type TileMapHoverCellChangedListener =
  (cell: CellCoord) => void;
export class TileMapCommander {
  private tileMap: TileMap;

  constructor(tileMap: TileMap) {
    this.tileMap = tileMap;
  }

  public centerOnNormalScaleWorldPoint(
    point: Readonly<PIXI.IPointData>
  ): void {
    this.tileMap.centerOnNormalScaleWorldPoint(point);
  }
}
