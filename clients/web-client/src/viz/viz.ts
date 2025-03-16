import * as PIXI from "pixi.js";
import Simulation from "../simulation/simulation";
import WorldMapTiledData from "../simulation/map/world_map_tiled_data";
import WorldMinimapData from "../simulation/map/world_minimap_data";
import CellMap from "./cell_map";
import { DatumVizSpec } from "./datum";
import Backplane from "./backplane";
import MiniMap from "./mini_map";

export default class Viz {
  public readonly canvas: HTMLCanvasElement;
  private readonly pixi: PIXI.Application;
  private backplane: Backplane;
  private cellMap: CellMap;
  private miniMap: MiniMap;

  private removePreventDefaultListener: (() => void) | undefined;
  private removeResizeListener: (() => void) | undefined;
  private removeWheelListener: (() => void) | undefined;
  private removeMouseDownListener: (() => void) | undefined;
  private removeMouseUpListener: (() => void) | undefined;
  private removeMouseMoveListener: (() => void) | undefined;

  public static create(canvas: HTMLCanvasElement, simulation: Simulation): Viz {
    console.log("Creating Viz");
    const viz = new Viz({
      canvas,
      mapData: simulation.mapData,
      minimapData: simulation.minimapData,
    });
    return viz;
  }

  public updateSize(width: number, height: number): void {
    this.pixi.renderer.resize(width, height);
  }

  public setVisualizedDatumIds(spec: DatumVizSpec|undefined): void {
    this.cellMap.setVisualizedDatumIds(spec);
  }

  public reuse(canvas: HTMLCanvasElement): void {
    if (canvas !== this.canvas) {
      throw new Error("Canvas mismatch");
    }
    this.init();
  }

  private constructor(args: {
    canvas: HTMLCanvasElement,
    mapData: WorldMapTiledData,
    minimapData: WorldMinimapData,
  }) {
    const { canvas, mapData, minimapData } = args;
    const screenWidth = canvas.width;
    const screenHeight = canvas.height;
    const pixi = new PIXI.Application({
      view: canvas,
      width: screenWidth,
      height: screenHeight,
      eventMode: "static",
      antialias: false,
      clearBeforeRender: false,
    });

    this.backplane = new Backplane(screenWidth, screenHeight);
    this.canvas = canvas;
    this.pixi = pixi;
    this.cellMap = Viz.makeCellMap(canvas, mapData);
    this.miniMap = new MiniMap({
      screenSize: { width: screenWidth, height: screenHeight },
      cellMapAccess: this.cellMap.getAccess(),
      worldDims: mapData.worldDims,
      miniDims: minimapData.miniDims,
      minimapData,
    });
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
    console.log("Initializing viz");
    this.cellMap.position.set(0, 0);
    this.pixi.stage.eventMode = "static";
    this.pixi.stage.addChild(this.backplane);
    this.pixi.stage.addChild(this.cellMap);

    this.pixi.stage.addChild(this.miniMap);
    this.miniMap.position.set(100, 100);

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
    this.backplane.onwheel = wheelListener;
    this.removeWheelListener = () => {
      if (this.backplane.onwheel === wheelListener) {
        this.backplane.onwheel = null;
      }
    };

    const mousedownListener = this.handleMouseDown.bind(this);
    this.backplane.onmousedown = mousedownListener;
    this.removeMouseDownListener = () => {
      if (this.backplane.onmousedown === mousedownListener) {
        this.backplane.onmousedown = null;
      }
    };

    const mouseupListener = this.handleMouseUp.bind(this);
    this.backplane.onmouseup = mouseupListener;
    this.backplane.onmouseupoutside = mouseupListener;
    this.removeMouseUpListener = () => {
      if (this.backplane.onmouseup === mouseupListener) {
        this.backplane.onmouseup = null;
        this.backplane.onmouseupoutside = null;
      }
    };

    const mouseMoveListener = this.handleMouseMove.bind(this);
    this.backplane.onmousemove = mouseMoveListener;
    this.backplane.onglobalmousemove = mouseMoveListener;
    this.removeMouseMoveListener = () => {
      if (this.backplane.onmousemove === mouseMoveListener) {
        this.backplane.onmousemove = null;
      }
    };
  }

  private handleResize(): void {
    const { width, height } = this.canvas.getBoundingClientRect();
    this.pixi.renderer.resize(width, height);
    this.backplane.resize(width, height);
    this.cellMap.resize(width, height);
    this.miniMap.resize({width, height});
  }

  private handleWheel(ev: PIXI.FederatedWheelEvent): void {
    // this.cellMap.handleWheel(ev.deltaY, { x: ev.clientX, y: ev.clientY });
    this.cellMap.handleWheel(ev.deltaY, this.localizePointerPosition(ev.global));
    ev.preventDefault();
  }

  private handleMouseDown(ev: PIXI.FederatedMouseEvent): void {
    if (ev.button === 0) {
      this.cellMap.handlePointerDown(this.localizePointerPosition(ev.global));
    }
    ev.stopPropagation();
  }

  private handleMouseUp(ev: PIXI.FederatedMouseEvent): void {
    if (ev.button === 0) {
      this.cellMap.handlePointerUp(this.localizePointerPosition(ev.global));
    }
    ev.stopPropagation();
  }

  private handleMouseMove(ev: PIXI.FederatedMouseEvent): void {
    this.cellMap.handlePointerMove(this.localizePointerPosition(ev.global));
    ev.stopPropagation();
  }

  private localizePointerPosition(pt: PIXI.IPointData): PIXI.IPointData {
    return this.pixi.stage.toLocal(pt);
  }
}
