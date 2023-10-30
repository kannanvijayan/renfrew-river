import * as PIXI from "pixi.js";

export default class GameMenuTitle extends PIXI.Container {
  private graphics: PIXI.Graphics;
  constructor() {
    const text = "Renfrew River";
    super();

    this.graphics = new PIXI.Graphics();
    this.graphics.beginFill(0x408080);
    this.graphics.lineStyle(0);
    this.graphics.drawRect(0, 0, 390, 95);
    this.graphics.endFill();
    this.addChild(this.graphics);

    const textItem = new PIXI.Text(text, {
      fontSize: 50,
      fontVariant: "small-caps",
    });
    textItem.anchor.set(0.5);
    textItem.x = 195;
    textItem.y = 47;
    this.graphics.addChild(textItem);
  }
}