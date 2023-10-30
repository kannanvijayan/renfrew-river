import * as PIXI from "pixi.js";

export default class GameMenuSubtitle extends PIXI.Container {
  private graphics: PIXI.Graphics;
  constructor(opts: { text: string }) {
    const { text } = opts;
    super();

    this.graphics = new PIXI.Graphics();
    this.graphics.beginFill(0x306060);
    this.graphics.lineStyle(0);
    this.graphics.drawRect(0, 0, 390, 60);
    this.graphics.endFill();
    this.addChild(this.graphics);

    const textItem = new PIXI.Text(text, {
      fontSize: 30,
      fontVariant: "normal",
    });
    textItem.anchor.set(0.5);
    textItem.x = 195;
    textItem.y = 30;
    this.graphics.addChild(textItem);
  }
}