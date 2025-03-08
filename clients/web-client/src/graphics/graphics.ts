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
      screenSize: [canvas.width, canvas.height],
    });
    this.hexMesh = hexMesh;
    this.pixi.stage.addChild(hexMesh.mesh);
    this.pixi.ticker.add(() => {
      this.pixi.renderer.render(this.pixi.stage);
    });
  }

  public updateSize(width: number, height: number): void {
    this.pixi.renderer.resize(width, height);
    this.hexMesh.updateSize(width, height);
  }

  public static async create(canvas: HTMLCanvasElement): Promise<Graphics> {
    const pixi = new PIXI.Application({
      view: canvas,
      width: canvas.width,
      height: canvas.height,
      antialias: true,
      resolution: window.devicePixelRatio,
    });
    return new Graphics(canvas, pixi);
  }
}
