import * as PIXI from 'pixi.js';
import TopViewAttributes from '../top_view_attributes';
import StageView from '../common/stage_view';
import MapView from './map_view';
import WorldObserver from '../../game/world_observer';
import {
  CellCoord,
  CellInfo,
  AnimalData,
  AnimalId,
} from "renfrew-river-protocol-client";

export interface PlayStageCallbackApi {
  localizePointerPosition(point: PIXI.IPointData): PIXI.IPointData;
  addTickCallback(callback: (delta: number, absTime: number) => void): void;
  newWorldObserver(): WorldObserver;
  ensureMapDataLoaded: (
    topleft: { col: number, row: number },
    area: { columns: number, rows: number }
  ) => Promise<{
    tilesUpdated: number,
    tilesInvalidated: number,
    surroundingsLoaded: Promise<{
      tilesUpdated: number,
      tilesInvalidated: number,
    }>
  }>,
  takeTurnStep: () => Promise<void>,
  getCellInfo: (cell: CellCoord) => Promise<CellInfo>;
  getAnimalData: (animalId: AnimalId) => Promise<AnimalData>;
}

/**
 * The start stage of the game.
 */
export default class PlayStageView extends StageView {
  private callbackApi: PlayStageCallbackApi;
  private worldObserver: WorldObserver;

  private mapView: MapView | null;

  constructor(opts: {
    topViewAttributes: TopViewAttributes,
    callbackApi: PlayStageCallbackApi,
  }) {
    const { callbackApi, topViewAttributes } = opts;
    super({ topViewAttributes });
    this.callbackApi = callbackApi;
    this.mapView = null;
    this.worldObserver = this.callbackApi.newWorldObserver();

    this.initMapView();
  }

  public shutdown() {
    this.destroyMapView();
    super.shutdown();
  }

  protected preResize(_width: number, _height: number): void {
    this.detachMapView();
  }
  protected postResize(width: number, height: number): void {
    this.reattachMapView();
    this.mapView!.handleResize(width, height);

    this.bindBackplaneEvents();
  }

  private initMapView(): void {
    this.mapView = new MapView({
      topViewAttributes: this.topViewAttributes,
      worldObserver: this.worldObserver,
      callbackApi: this.callbackApi,
    });
    this.mapView.x = 0;
    this.mapView.y = 0;
    this.addChild(this.mapView);

    this.bindBackplaneEvents();
  }

  private destroyMapView(): void {
    if (this.mapView !== null) {
      this.mapView.shutdown();
      this.removeChild(this.mapView);
      this.mapView = null;
    }
  }

  private detachMapView(): void {
    if (this.mapView !== null) {
      this.removeChild(this.mapView);
    }
  }
  private reattachMapView(): void {
    if (this.mapView !== null) {
      this.addChild(this.mapView);
    }
  }

  private bindBackplaneEvents(): void {
    this.backplane.eventMode = "static";
    this.backplane.onrightclick = this.handleRightMouseDown.bind(this);
    this.backplane.onmousedown = this.handleMouseDown.bind(this);
    this.backplane.onmouseup = this.handleMouseUp.bind(this);
    this.backplane.onmouseupoutside = this.handleMouseUp.bind(this);
    this.backplane.onmousemove = this.handleMouseMove.bind(this);
    this.backplane.onwheel = this.handleWheel.bind(this);
  }

  private handleRightMouseDown(e: PIXI.FederatedMouseEvent): void {
    this.mapView?.handleRightMouseDown(e);
  }

  private handleMouseDown(e: PIXI.FederatedMouseEvent): void {
    this.mapView?.handleMouseDown(e);
  }
  private handleMouseUp(e: PIXI.FederatedMouseEvent): void {
    this.mapView?.handleMouseUp(e);
  }
  private handleMouseMove(e: PIXI.FederatedMouseEvent): void {
    this.mapView?.handleMouseMove(e);
  }
  private handleWheel(e: PIXI.FederatedWheelEvent): void {
    this.mapView?.handleWheel(e);
  }
}
