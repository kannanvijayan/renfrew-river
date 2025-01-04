import * as PIXI from 'pixi.js';

import ViewObserver from '../ViewObserver';

import WorldObserver from '../game/world_observer';

import CellMap from './cell_map';
import MiniMap from './mini_map';
import NextTurnButton from './next_turn_button';
import CellInfoPanel from './cell_info_panel';
import {
  CellCoord,
  CellInfo,
  AnimalData,
  AnimalId,
  WorldDims
} from "renfrew-river-protocol-client";
import StageView from './stage_view';

export interface MainVizCallbackApi {
  localizePointerPosition(point: PIXI.IPointData): PIXI.IPointData;
  addTickCallback(callback: (delta: number, absTime: number) => void): void;
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

export default class MainViz extends StageView {
  private readonly worldObserver_: WorldObserver;
  private readonly callbackApi_: MainVizCallbackApi;
  private readonly contents_: MainVizContents;

  private readonly tickCallback_: (delta: number, absTime: number) => void;
  private readonly unregisterInvalidationCallback_: () => void;

  constructor(opts: {
    viewObserver: ViewObserver,
    worldObserver: WorldObserver,
    callbackApi: MainVizCallbackApi
  }) {
    super({ viewObserver: opts.viewObserver });
    this.worldObserver_ = opts.worldObserver;
    this.callbackApi_ = opts.callbackApi;

    const dimensions = this.worldObserver_.worldDims();

    // Bind backplane events.
    this.bindBackplaneEvents();

    this.tickCallback_ = (_delta: number, absTime: number) => {
      this.contents_.updateTime(absTime);
    };
    this.callbackApi_.addTickCallback(this.tickCallback_);

    this.unregisterInvalidationCallback_ =
      this.worldObserver_.addMapInvalidationListener(
        () => this.contents_.handleMapInvalidated()
      );
    
    this.contents_ = new MainVizContents({
      dims: dimensions,
      viewObserver: this.viewObserver_,
      worldObserver: this.worldObserver_,
      callbackApi: this.callbackApi_,
    });
    this.addChild(this.contents_);
    this.contents_.x = 0;
    this.contents_.y = 0;
  }

  protected override preResize(_width: number, _height: number): void {
    this.removeChild(this.contents_);
  }

  protected override postResize(width: number, height: number): void {
    this.addChild(this.contents_);
    this.contents_.postResize(width, height);

    this.bindBackplaneEvents();
  }

  private bindBackplaneEvents(): void {
    this.backplane.eventMode = "static";
    this.backplane.onrightclick = ev => this.contents_.handleRightMouseDown(ev);
    this.backplane.onmousedown = ev => this.contents_.handleMouseDown(ev);
    this.backplane.onmouseup = ev => this.contents_.handleMouseUp(ev);
    this.backplane.onmouseupoutside = ev => this.contents_.handleMouseUp(ev);
    this.backplane.onmousemove = ev => this.contents_.handleMouseMove(ev);
    this.backplane.onwheel = ev => this.contents_.handleWheel(ev);
  }

  public shutdown(): void {
    // TODO: unregister tick callback.
    this.unregisterInvalidationCallback_();
    super.shutdown();
  }
}

class MainVizContents extends PIXI.Container {
  private readonly callbackApi_: MainVizCallbackApi;
  private readonly viewObserver_: ViewObserver;

  private readonly cellMap_: CellMap;
  private readonly miniMap_: MiniMap;
  private readonly nextTurnButton_: NextTurnButton;
  private readonly cellInfoPanel_: CellInfoPanel;

  constructor(args: {
    dims: WorldDims,
    viewObserver: ViewObserver,
    worldObserver: WorldObserver,
    callbackApi: MainVizCallbackApi,
  }) {
    super();
    this.callbackApi_ = args.callbackApi;
    this.viewObserver_ = args.viewObserver;

    const { dims, viewObserver, worldObserver, callbackApi } = args;

    // Add the cell-map to the stage.
    this.cellMap_ = new CellMap({
      worldColumns: dims.columns,
      worldRows: dims.rows,
      areaWidth: window.innerWidth,
      areaHeight: window.innerHeight,
      mapData: worldObserver.mapData(),
      callbackApi: { ensureMapDataLoaded: callbackApi.ensureMapDataLoaded }
    });
    this.cellMap_.x = 0;
    this.cellMap_.y = 0;
    this.addChild(this.cellMap_);

    const miniWidth = 400;
    this.miniMap_ = new MiniMap({
      viewObserver: viewObserver,
      cellMapObserver: this.cellMap_.getObserver(),
      cellMapCommander: this.cellMap_.getCommander(),
      worldColumns: dims.columns,
      worldRows: dims.rows,
      miniWidth,
      minimapData: worldObserver.minimapData(),
    });
    this.miniMap_.x = viewObserver.areaWidth - this.miniMap_.width;
    this.miniMap_.y = 0;
    this.addChild(this.miniMap_);

    // Add the next turn button to the stage.
    // Place it at the bottom right corner.
    this.nextTurnButton_ = new NextTurnButton({
      onClickListener: () => {
        console.log("Next turn button clicked");
        callbackApi.takeTurnStep();
      }
    });
    this.nextTurnButton_.x =
      viewObserver.areaWidth - this.nextTurnButton_.width;
    this.nextTurnButton_.y =
      viewObserver.areaHeight - this.nextTurnButton_.height;
    this.addChild(this.nextTurnButton_);

    // Add a cell-info panel to the stage.
    // Position it at the bottom left corner.
    this.cellInfoPanel_ = new CellInfoPanel({
      callbackApi: {
        getCellInfo: callbackApi.getCellInfo,
        getAnimalData: callbackApi.getAnimalData,
      },
      worldObserver,
      cellMapObserver: this.cellMap_.getObserver(),
    });
    this.cellInfoPanel_.x = 0;
    this.cellInfoPanel_.y = viewObserver.areaHeight - this.cellInfoPanel_.height;
    this.addChild(this.cellInfoPanel_);
  }

  postResize(width: number, height: number): void {
    // Adjust the cell-map.
    this.cellMap_.handleResize(width, height);

    // Reposition the minimap.
    this.miniMap_.x =
      this.viewObserver_.areaWidth - this.miniMap_.width;

    // Reposition the next turn button.
    this.nextTurnButton_.x =
      this.viewObserver_.areaWidth - this.nextTurnButton_.width;
    this.nextTurnButton_.y =
      this.viewObserver_.areaHeight - this.nextTurnButton_.height;

    // Reposition the cell info panel.
    this.cellInfoPanel_.x = 0;
    this.cellInfoPanel_.y =
      this.viewObserver_.areaHeight - this.cellInfoPanel_.height;
  }

  updateTime(absTime: number): void {
    this.cellMap_.updateTime(absTime);
  }

  public handleRightMouseDown(ev: PIXI.FederatedMouseEvent): void {
    const point = this.callbackApi_.localizePointerPosition(ev.global);
    this.cellMap_.handleRightPointerDown(point);
  }

  public handleMouseDown(ev: PIXI.FederatedMouseEvent): void {
    const point = this.callbackApi_.localizePointerPosition(ev.global);
    this.cellMap_.handlePointerDown(point);
  }

  public handleMouseUp(ev: PIXI.FederatedMouseEvent): void {
    const point = this.callbackApi_.localizePointerPosition(ev.global);
    this.cellMap_.handlePointerUp(point);
  }

  public handleMouseMove(ev: PIXI.FederatedMouseEvent): void {
    const point = this.callbackApi_.localizePointerPosition(ev.global);
    this.cellMap_.handlePointerMove(point);
  }

  public handleWheel(ev: PIXI.FederatedWheelEvent): void {
    const point = this.callbackApi_.localizePointerPosition(ev.global);
    this.cellMap_.handleWheel(ev.deltaY, point);
  }

  public handleMapInvalidated(): void {
    this.cellMap_.handleMapInvalidated();
  }
}
