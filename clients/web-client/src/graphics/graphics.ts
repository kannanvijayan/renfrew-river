import * as PIXI from "pixi.js";
import HexMesh from "./hex_mesh";

export default class Graphics {
  public readonly canvas: HTMLCanvasElement;
  private readonly pixi: PIXI.Application;
  private hexMesh: HexMesh;

  public static create(canvas: HTMLCanvasElement): Graphics {
    console.log("Creating Graphics");
    const pixi = new PIXI.Application({
      view: canvas,
      width: canvas.width,
      height: canvas.height,
      antialias: false,
      clearBeforeRender: false,
    });
    return new Graphics(canvas, pixi);
  }

  public updateSize(width: number, height: number): void {
    this.pixi.renderer.resize(width, height);
  }

  public cleanup(): void {
    console.log("Cleaning up Graphics", { stack: new Error().stack?.split("\n") });
    this.pixi.stage.removeChild(this.hexMesh.mesh);
    this.hexMesh.mesh.destroy();
  }

  public reset(canvas: HTMLCanvasElement): void {
    if (canvas !== this.canvas) {
      throw new Error("Canvas mismatch");
    }
  }

  private constructor(canvas: HTMLCanvasElement, pixi: PIXI.Application) {
    this.canvas = canvas;
    this.pixi = pixi;
    this.hexMesh = this.makeHexMesh();
    this.hexMesh.mesh.x = 0;
    this.hexMesh.mesh.y = 0;
    this.pixi.stage.addChild(this.hexMesh.mesh);
  }

  private makeHexMesh(): HexMesh {
    const hexMesh = new HexMesh({
      columns: 1000,
      rows: 1000,
      topLeftWorldColumn: 0,
      topLeftWorldRow: 0,
      worldColumns: 1000,
      worldRows: 1000,
    });
    hexMesh.mesh.x = 0;
    hexMesh.mesh.y = 0;
    hexMesh.mesh.scale.set(1 / 10);
    return hexMesh;
  }
}
