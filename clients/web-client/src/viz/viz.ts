import * as PIXI from "pixi.js";
import WorldMapTiledData from "../simulation/map/world_map_tiled_data";
import Simulation from "../simulation/simulation";
import CellMap from "./cell_map";
import { DatumVizSpec } from "./datum";

export default class Viz {
  public readonly canvas: HTMLCanvasElement;
  private readonly pixi: PIXI.Application;
  private cellMap: CellMap;

  private removePreventDefaultListener: (() => void) | undefined;
  private removeResizeListener: (() => void) | undefined;
  private removeWheelListener: (() => void) | undefined;
  private removeMouseDownListener: (() => void) | undefined;
  private removeMouseUpListener: (() => void) | undefined;
  private removeMouseMoveListener: (() => void) | undefined;

  public static create(canvas: HTMLCanvasElement, simulation: Simulation): Viz {
    console.log("Creating Viz");
    const viz = new Viz(canvas, simulation.mapData);
    return viz;
  }

  public updateSize(width: number, height: number): void {
    this.pixi.renderer.resize(width, height);
  }

  public setVisualizedDatumIds(spec: DatumVizSpec|undefined): void {
    this.cellMap.setVisualizedDatumIds(spec);
  }

  public cleanup(): void {
    console.log("Cleaning up Viz", { stack: new Error().stack?.split("\n") });
    this.pixi.stage.removeChild(this.cellMap);
    this.cellMap.cleanup();
    this.cellMap.destroy();

    this.removePreventDefaultListener?.();
    this.removePreventDefaultListener = undefined;

    this.removeResizeListener?.();
    this.removeResizeListener = undefined;

    this.removeWheelListener?.();
    this.removeWheelListener = undefined;

    this.removeMouseDownListener?.();
    this.removeMouseDownListener = undefined;

    this.removeMouseUpListener?.();
    this.removeMouseUpListener = undefined;

    this.removeMouseMoveListener?.();
    this.removeMouseMoveListener = undefined;
  }

  public reuse(canvas: HTMLCanvasElement): void {
    if (canvas !== this.canvas) {
      throw new Error("Canvas mismatch");
    }
  }

  private constructor(
    canvas: HTMLCanvasElement,
    mapData: WorldMapTiledData,
  ) {
    const pixi = new PIXI.Application({
      view: canvas,
      width: canvas.width,
      height: canvas.height,
      eventMode: "passive",
      antialias: false,
      clearBeforeRender: false,
    });

    this.canvas = canvas;
    this.pixi = pixi;
    this.cellMap = Viz.makeCellMap(canvas, mapData);
    this.init();
  }

  private static makeCellMap(
    canvas: HTMLCanvasElement,
    mapData: WorldMapTiledData
  ): CellMap {
    return new CellMap({
      worldColumns: mapData.worldDims.columns,
      worldRows: mapData.worldDims.rows,
      areaWidth: canvas.width,
      areaHeight: canvas.height,
      mapData,
    });
  }

  private init(): void {
    this.cellMap.position.set(0, 0);
    this.pixi.stage.addChild(this.cellMap);

    // Suppress right-click and key down/up events on the game canvas
    // (we'll handle it ourselves later).
    const preventDefaultListener = (ev: Event) => ev.preventDefault();
    this.canvas.addEventListener("contextmenu", preventDefaultListener);
    this.canvas.addEventListener("keydown", preventDefaultListener);
    this.canvas.addEventListener("keyup", preventDefaultListener);
    this.removePreventDefaultListener = () => {
      this.canvas.removeEventListener("contextmenu", preventDefaultListener);
      this.canvas.removeEventListener("keydown", preventDefaultListener);
      this.canvas.removeEventListener("keyup", preventDefaultListener);
    };

    // Handle resize events.
    const resize = this.handleResize.bind(this);
    window.addEventListener("resize", resize);
    this.removeResizeListener =
      () => window.removeEventListener("resize", resize);

    const wheelListener = this.handleWheel.bind(this);
    this.canvas.addEventListener("wheel", wheelListener);
    this.removeWheelListener =
      () => this.canvas.removeEventListener("wheel", wheelListener);

    const mousedownListener = this.handleMouseDown.bind(this);
    this.canvas.addEventListener("mousedown", mousedownListener);
    this.removeMouseDownListener =
      () => this.canvas.removeEventListener("mousedown", mousedownListener);

    const mouseupListener = this.handleMouseUp.bind(this);
    this.canvas.addEventListener("mouseup", mouseupListener);
    this.removeMouseUpListener =
      () => this.canvas.removeEventListener("mouseup", mouseupListener);

    const mouseMoveListener = this.handleMouseMove.bind(this);
    this.canvas.addEventListener("mousemove", mouseMoveListener);
    this.removeMouseMoveListener =
      () => this.canvas.removeEventListener("mousemove", mouseMoveListener);
  }

  private handleResize(): void {
    const { width, height } = this.canvas.getBoundingClientRect();
    this.pixi.renderer.resize(width, height);
    this.cellMap.handleResize(width, height);
  }

  private handleWheel(ev: WheelEvent): void {
    this.cellMap.handleWheel(ev.deltaY, { x: ev.clientX, y: ev.clientY });
    ev.preventDefault();
  }

  private handleMouseDown(ev: MouseEvent): void {
    if (ev.button === 0) {
      this.cellMap.handlePointerDown({ x: ev.clientX, y: ev.clientY });
    }
  }

  private handleMouseUp(ev: MouseEvent): void {
    if (ev.button === 0) {
      this.cellMap.handlePointerUp({ x: ev.clientX, y: ev.clientY });
    }
  }

  private handleMouseMove(ev: MouseEvent): void {
    this.cellMap.handlePointerMove({ x: ev.clientX, y: ev.clientY });
  }
}
