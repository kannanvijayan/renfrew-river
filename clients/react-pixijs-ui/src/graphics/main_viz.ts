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

export default class MainViz extends PIXI.Container {
  private readonly viewObserver: ViewObserver;
  private readonly worldObserver: WorldObserver;
  private readonly callbackApi: MainVizCallbackApi;
  private readonly cellMap: CellMap;
  private readonly miniMap: MiniMap;
  private readonly nextTurnButton: NextTurnButton;
  private readonly cellInfoPanel: CellInfoPanel;

  constructor(opts: {
    viewObserver: ViewObserver,
    worldObserver: WorldObserver,
    callbackApi: MainVizCallbackApi
  }) {
    super();
    this.viewObserver = opts.viewObserver;
    this.worldObserver = opts.worldObserver;
    this.callbackApi = opts.callbackApi;

    const dimensions = this.worldObserver.worldDims();

    this.cellMap = new CellMap({
      worldColumns: dimensions.columns,
      worldRows: dimensions.rows,
      areaWidth: window.innerWidth,
      areaHeight: window.innerHeight,
      mapData: this.worldObserver.mapData(),
      callbackApi: { ensureMapDataLoaded: this.callbackApi.ensureMapDataLoaded }
    });

    this.callbackApi.addTickCallback((_delta: number, absTime: number) => {
      this.cellMap.updateTime(absTime);
    });

    this.worldObserver.addMapInvalidationListener(
      this.handleMapInvalidated.bind(this)
    );

    // Add the cell-map to the stage.
    this.cellMap.x = 0;
    this.cellMap.y = 0;
    this.addChild(this.cellMap);

    const miniWidth = 400;
    this.miniMap = new MiniMap({
      viewObserver: this.viewObserver,
      cellMapObserver: this.cellMap.getObserver(),
      cellMapCommander: this.cellMap.getCommander(),
      worldColumns: dimensions.columns,
      worldRows: dimensions.rows,
      miniWidth,
      minimapData: this.worldObserver.minimapData(),
    });
    this.miniMap.x =
      this.viewObserver.areaWidth - this.miniMap.width;
    this.miniMap.y = 0;
    this.addChild(this.miniMap);

    // Add the next turn button to the stage.
    // Place it at the bottom right corner.
    this.nextTurnButton = new NextTurnButton({
      onClickListener: () => {
        console.log("Next turn button clicked");
        this.callbackApi.takeTurnStep();
      }
    });
    this.nextTurnButton.x =
      this.viewObserver.areaWidth - this.nextTurnButton.width;
    this.nextTurnButton.y =
      this.viewObserver.areaHeight - this.nextTurnButton.height;
    this.addChild(this.nextTurnButton);

    // Add a cell-info panel to the stage.
    // Position it at the bottom left corner.
    this.cellInfoPanel = new CellInfoPanel({
      callbackApi: {
        getCellInfo: this.callbackApi.getCellInfo,
        getAnimalData: this.callbackApi.getAnimalData,
      },
      worldObserver: this.worldObserver,
      cellMapObserver: this.cellMap.getObserver(),
    });
    this.cellInfoPanel.x = 0;
    this.cellInfoPanel.y =
      this.viewObserver.areaHeight - this.cellInfoPanel.height;
    this.addChild(this.cellInfoPanel);
  }

  public handleResize(width: number, height: number): void {
    // Adjust the cell-map.
    this.cellMap.handleResize(width, height);

    // Reposition the minimap.
    this.miniMap.x =
      this.viewObserver.areaWidth - this.miniMap.width;

    // Reposition the next turn button.
    this.nextTurnButton.x =
      this.viewObserver.areaWidth - this.nextTurnButton.width;
    this.nextTurnButton.y =
      this.viewObserver.areaHeight - this.nextTurnButton.height;

    // Reposition the cell info panel.
    this.cellInfoPanel.x = 0;
    this.cellInfoPanel.y =
      this.viewObserver.areaHeight - this.cellInfoPanel.height;
  }

  public handleRightMouseDown(ev: PIXI.FederatedMouseEvent): void {
    const point = this.callbackApi.localizePointerPosition(ev.global);
    this.cellMap.handleRightPointerDown(point);
  }

  public handleMouseDown(ev: PIXI.FederatedMouseEvent): void {
    const point = this.callbackApi.localizePointerPosition(ev.global);
    this.cellMap.handlePointerDown(point);
  }

  public handleMouseUp(ev: PIXI.FederatedMouseEvent): void {
    const point = this.callbackApi.localizePointerPosition(ev.global);
    this.cellMap.handlePointerUp(point);
  }

  public handleMouseMove(ev: PIXI.FederatedMouseEvent): void {
    const point = this.callbackApi.localizePointerPosition(ev.global);
    this.cellMap.handlePointerMove(point);
  }

  public handleWheel(ev: PIXI.FederatedWheelEvent): void {
    const point = this.callbackApi.localizePointerPosition(ev.global);
    this.cellMap.handleWheel(ev.deltaY, point);
  }

  private handleMapInvalidated(): void {
    this.cellMap.handleMapInvalidated();
  }

  public shutdown(): void {
  }
}
