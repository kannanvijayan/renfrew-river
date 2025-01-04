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
  AnimalId
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
  private readonly cellMap_: CellMap;
  private readonly miniMap_: MiniMap;
  private readonly nextTurnButton_: NextTurnButton;
  private readonly cellInfoPanel_: CellInfoPanel;

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

    // Add the cell-map to the stage.
    this.cellMap_ = new CellMap({
      worldColumns: dimensions.columns,
      worldRows: dimensions.rows,
      areaWidth: window.innerWidth,
      areaHeight: window.innerHeight,
      mapData: this.worldObserver_.mapData(),
      callbackApi: { ensureMapDataLoaded: this.callbackApi_.ensureMapDataLoaded }
    });
    this.cellMap_.x = 0;
    this.cellMap_.y = 0;
    this.addChild(this.cellMap_);

    // Bind backplane events.
    this.backplane.eventMode = "static";
    this.backplane.onrightclick = this.handleRightMouseDown.bind(this);
    this.backplane.onmousedown = this.handleMouseDown.bind(this);
    this.backplane.onmouseup = this.handleMouseUp.bind(this);
    this.backplane.onmouseupoutside = this.handleMouseUp.bind(this);
    this.backplane.onmousemove = this.handleMouseMove.bind(this);
    this.backplane.onwheel = this.handleWheel.bind(this);


    this.tickCallback_ = (_delta: number, absTime: number) => {
      this.cellMap_.updateTime(absTime);
    };
    this.callbackApi_.addTickCallback(this.tickCallback_);

    this.unregisterInvalidationCallback_ =
      this.worldObserver_.addMapInvalidationListener(
        this.handleMapInvalidated.bind(this)
      );

    const miniWidth = 400;
    this.miniMap_ = new MiniMap({
      viewObserver: this.viewObserver_,
      cellMapObserver: this.cellMap_.getObserver(),
      cellMapCommander: this.cellMap_.getCommander(),
      worldColumns: dimensions.columns,
      worldRows: dimensions.rows,
      miniWidth,
      minimapData: this.worldObserver_.minimapData(),
    });
    this.miniMap_.x =
      this.viewObserver_.areaWidth - this.miniMap_.width;
    this.miniMap_.y = 0;
    this.addChild(this.miniMap_);

    // Add the next turn button to the stage.
    // Place it at the bottom right corner.
    this.nextTurnButton_ = new NextTurnButton({
      onClickListener: () => {
        console.log("Next turn button clicked");
        this.callbackApi_.takeTurnStep();
      }
    });
    this.nextTurnButton_.x =
      this.viewObserver_.areaWidth - this.nextTurnButton_.width;
    this.nextTurnButton_.y =
      this.viewObserver_.areaHeight - this.nextTurnButton_.height;
    this.addChild(this.nextTurnButton_);

    // Add a cell-info panel to the stage.
    // Position it at the bottom left corner.
    this.cellInfoPanel_ = new CellInfoPanel({
      callbackApi: {
        getCellInfo: this.callbackApi_.getCellInfo,
        getAnimalData: this.callbackApi_.getAnimalData,
      },
      worldObserver: this.worldObserver_,
      cellMapObserver: this.cellMap_.getObserver(),
    });
    this.cellInfoPanel_.x = 0;
    this.cellInfoPanel_.y =
      this.viewObserver_.areaHeight - this.cellInfoPanel_.height;
    this.addChild(this.cellInfoPanel_);
  }

  protected override postResize(width: number, height: number): void {
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

  private handleMapInvalidated(): void {
    this.cellMap_.handleMapInvalidated();
  }

  public shutdown(): void {
    // TODO: unregister tick callback.
    this.unregisterInvalidationCallback_();
    super.shutdown();
  }
}
