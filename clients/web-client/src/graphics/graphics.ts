import * as PIXI from "pixi.js";
import HexMesh from "./hex_mesh";

export default class Graphics {
  private readonly canvas: HTMLCanvasElement;
  private readonly pixi: PIXI.Application;
  private readonly hexMesh: HexMesh;

  private constructor(canvas: HTMLCanvasElement, pixi: PIXI.Application) {
    this.canvas = canvas;
    this.pixi = pixi;
    const hexMesh = new HexMesh({
      columns: 1000,
      rows: 1000,
      topLeftWorldColumn: 0,
      topLeftWorldRow: 0,
      worldColumns: 1000,
      worldRows: 1000,
    });
    this.hexMesh = hexMesh;
    this.hexMesh.mesh.x = 0;
    this.hexMesh.mesh.y = 0;
    this.pixi.stage.addChild(hexMesh.mesh);
    this.pixi.ticker.add(() => {
      this.pixi.renderer.render(this.pixi.stage);
    });
  }

  public updateSize(width: number, height: number): void {
    this.pixi.renderer.resize(width, height);
  }

  public static async create(canvas: HTMLCanvasElement): Promise<Graphics> {
    const pixi = new PIXI.Application({
      view: canvas,
      width: canvas.width,
      height: canvas.height,
      antialias: false,
      clearBeforeRender: false,
    });
    return new Graphics(canvas, pixi);
  }
}
