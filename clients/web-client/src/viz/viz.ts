import * as PIXI from "pixi.js";
import WorldMapTiledData from "../simulation/map/world_map_tiled_data";
import Simulation from "../simulation/simulation";
import CellMap from "./cell_map";

export default class Viz {
  public readonly canvas: HTMLCanvasElement;
  private readonly pixi: PIXI.Application;
  private mapData: WorldMapTiledData;
  private cellMap: CellMap;

  public static create(canvas: HTMLCanvasElement, simulation: Simulation): Viz {
    console.log("Creating Viz");
    const pixi = new PIXI.Application({
      view: canvas,
      width: canvas.width,
      height: canvas.height,
      antialias: false,
      clearBeforeRender: false,
    });
    return new Viz(canvas, pixi, simulation.mapData);
  }

  public updateSize(width: number, height: number): void {
    this.pixi.renderer.resize(width, height);
  }

  public cleanup(): void {
    console.log("Cleaning up Viz", { stack: new Error().stack?.split("\n") });
    this.pixi.stage.removeChild(this.cellMap);
    this.cellMap.cleanup();
  }

  public reset(canvas: HTMLCanvasElement): void {
    if (canvas !== this.canvas) {
      throw new Error("Canvas mismatch");
    }
  }

  private constructor(
    canvas: HTMLCanvasElement,
    pixi: PIXI.Application,
    mapData: WorldMapTiledData,
  ) {
    this.canvas = canvas;
    this.pixi = pixi;
    this.mapData = mapData;
    this.cellMap = new CellMap({
      worldColumns: mapData.worldDims.columns,
      worldRows: mapData.worldDims.rows,
      areaWidth: canvas.width,
      areaHeight: canvas.height,
      mapData,
    });
    this.cellMap.position.set(0, 0);
    this.pixi.stage.addChild(this.cellMap);
  }
}
