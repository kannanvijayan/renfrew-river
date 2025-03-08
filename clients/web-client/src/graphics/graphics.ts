import * as PIXI from "pixi.js";
import HexMesh from "./hex_mesh";

export default class Graphics {
  private readonly pixi: PIXI.Application;

  private constructor(pixi: PIXI.Application) {
    this.pixi = pixi;
    const hexMesh = new HexMesh({
      screenSize: [pixi.canvas.width, pixi.canvas.height],
    });
    this.pixi.stage.addChild(hexMesh.mesh);
    this.pixi.ticker.add(() => {
      this.pixi.renderer.render(this.pixi.stage);
    });
  }

  public static async create(canvas: HTMLCanvasElement): Promise<Graphics> {
    const pixi = new PIXI.Application();
    await pixi.init({
      view: canvas,
      width: canvas.width,
      height: canvas.height,
      antialias: true,
      resolution: window.devicePixelRatio,
    });
    return new Graphics(pixi);
  }
}
