import * as PIXI from 'pixi.js';
import WorldObserver from '../../game/world_observer';
import TopViewAttributes from '../top_view_attributes';
import TileMap from './tile_map';
import MiniMap from './mini_map';

export interface MapViewCallbackApi {
  localizePointerPosition(point: PIXI.IPointData): PIXI.IPointData;
  addTickCallback(callback: (delta: number, absTime: number) => void): void;
  ensureMapDataLoaded: (
    topleft: { col: number, row: number },
    area: { columns: number, rows: number }
  ) => Promise<{
    newTilesWritten: boolean,
    surroundingsLoaded: Promise<{ newTilesWritten: boolean }>
  }>,
}

export default class MapView extends PIXI.Container {
  private readonly topViewAttributes: TopViewAttributes;
  private readonly worldObserver: WorldObserver;
  private readonly callbackApi: MapViewCallbackApi;
  private readonly tileMap: TileMap;
  private readonly miniMap: MiniMap;

  constructor(opts: {
    topViewAttributes: TopViewAttributes,
    worldObserver: WorldObserver,
    callbackApi: MapViewCallbackApi
  }) {
    super();
    this.topViewAttributes = opts.topViewAttributes;
    this.worldObserver = opts.worldObserver;
    this.callbackApi = opts.callbackApi;

    const dimensions = this.worldObserver.worldDims();

    this.tileMap = new TileMap({
      worldColumns: dimensions.columns,
      worldRows: dimensions.rows,
      areaWidth: window.innerWidth,
      areaHeight: window.innerHeight,
      mapData: this.worldObserver.mapData(),
      callbackApi: { ensureMapDataLoaded: this.callbackApi.ensureMapDataLoaded }
    });

    this.callbackApi.addTickCallback((delta: number, absTime: number) => {
      this.tileMap.updateTime(absTime);
    });

    // Add the tile map to the stage.
    this.tileMap.x = 0;
    this.tileMap.y = 0;
    this.addChild(this.tileMap);

    const miniWidth = this.topViewAttributes.areaWidth / 4;
    this.miniMap = new MiniMap({
      topViewAttributes: this.topViewAttributes,
      tileMapObserver: this.tileMap.getObserver(),
      tileMapCommander: this.tileMap.getCommander(),
      worldColumns: dimensions.columns,
      worldRows: dimensions.rows,
      miniWidth,
      minimapData: this.worldObserver.minimapData(),
    });
    this.miniMap.x =
      this.topViewAttributes.areaWidth - this.miniMap.width;
    this.miniMap.y = 0;
    this.addChild(this.miniMap);
  }

  public handleResize(width: number, height: number): void {
    this.tileMap.handleResize(width, height);
    this.miniMap.x =
      this.topViewAttributes.areaWidth - this.miniMap.width;
  }

  public handleMouseDown(ev: PIXI.FederatedMouseEvent): void {
    const point = this.callbackApi.localizePointerPosition(ev.global);
    this.tileMap.handlePointerDown(point);
  }

  public handleMouseUp(ev: PIXI.FederatedMouseEvent): void {
    const point = this.callbackApi.localizePointerPosition(ev.global);
    this.tileMap.handlePointerUp(point);
  }

  public handleMouseMove(ev: PIXI.FederatedMouseEvent): void {
    const point = this.callbackApi.localizePointerPosition(ev.global);
    this.tileMap.handlePointerMove(point);
  }

  public handleWheel(ev: PIXI.FederatedWheelEvent): void {
    const point = this.callbackApi.localizePointerPosition(ev.global);
    this.tileMap.handleWheel(ev.deltaY, point);
  }

  public shutdown(): void {
  }
}