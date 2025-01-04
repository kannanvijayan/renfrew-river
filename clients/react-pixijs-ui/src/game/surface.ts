import * as PIXI from 'pixi.js';
import {
  AnimalData,
  AnimalId,
  CellCoord,
  CellInfo,
} from 'renfrew-river-protocol-client';

import ViewObserver, { makeViewObserver } from '../ViewObserver';

import MainViz from '../graphics/main_viz';
import WorldObserver from './world_observer';

export interface GameSurfaceCallbackApi {
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
 * Represents a visually rendered surface.
 * 
 * Held as a member of `GameInstance`.
 */
export default class GameSurface {
  public readonly canvas: HTMLCanvasElement;
  private readonly pixiApp_: PIXI.Application;

  private readonly canvasContextMenuListener_: (ev: MouseEvent) => void;
  private readonly windowResizeListener_: () => void;

  private absTime_: number = 0;
  private readonly tickCallbacks_: Array<(delta: number, absTime: number) => void> = [];

  private viewObserver_: ViewObserver | null = null;

  public constructor(args: {
    canvas: HTMLCanvasElement,
    worldObserver: WorldObserver,
    callbackApi: GameSurfaceCallbackApi,
  }) {
    const { canvas, worldObserver, callbackApi } = args;
    this.canvas = canvas;
    this.pixiApp_ = new PIXI.Application({
      backgroundColor: 0x88cc66,
      resolution: window.devicePixelRatio || 1,
      view: this.canvas,
      // resizeTo: this.canvas,
      eventMode: "passive",
      antialias: true,
    });

    // Add the main visualization.
    this.viewObserver_ = makeViewObserver({
      areaWidth: canvas.offsetWidth,
      areaHeight: canvas.offsetHeight,
    });

    const mainViz = new MainViz({
      viewObserver: this.viewObserver_,
      worldObserver,
      callbackApi: {
        ...callbackApi,
        localizePointerPosition: (point: PIXI.IPointData): PIXI.IPointData => {
          return this.pixiApp_.stage.toLocal(point);
        },
        addTickCallback: (callback: (delta: number, absTime: number) => void) => {
          this.tickCallbacks_.push(callback);
        },
      }
    });
    this.pixiApp_.stage.addChild(mainViz);

    // Add ticker forwarding to any listeners.
    this.pixiApp_.ticker.add(delta => {
      this.absTime_ += delta;
      this.handleTick(delta, this.absTime_);
    });

    // Suppress right-click context menu on canvas.
    this.canvasContextMenuListener_ = ev => ev.preventDefault();
    this.canvas.addEventListener("contextmenu", this.canvasContextMenuListener_);

    // Handle window resizing.
    this.windowResizeListener_ = this.syncAfterResize.bind(this);
    window.addEventListener("resize", this.windowResizeListener_);
    this.pixiApp_.renderer.resize(this.canvas.offsetWidth, this.canvas.offsetHeight);

    // Suppress default action on keypresses.
    window.addEventListener("keydown", (ev: KeyboardEvent) => {
      ev.preventDefault();
    });
    window.addEventListener("keyup", (ev: KeyboardEvent) => {
      ev.preventDefault();
    });
  }

  public matchesCanvas(canvas: HTMLCanvasElement): boolean {
    return this.canvas === canvas;
  }

  public destroy(): void {
    console.warn("KVKV GameSurface.destroy");
    this.pixiApp_.destroy();
    window.removeEventListener("resize", this.windowResizeListener_);
    this.canvas.removeEventListener("contextmenu", this.canvasContextMenuListener_);
    this.viewObserver_ = null;
  }

  private syncAfterResize(): void {
    const { offsetWidth, offsetHeight } = this.canvas;
    console.warn("KVKV syncAfterResize", { offsetWidth, offsetHeight });
    this.pixiApp_.renderer.resize(offsetWidth, offsetHeight);
    this.viewObserver_?.resize(offsetWidth, offsetHeight);
  }

  private handleTick(delta: number, absTime: number): void {
    for (const callback of this.tickCallbacks_) {
      callback(delta, absTime);
    }
  }
}
