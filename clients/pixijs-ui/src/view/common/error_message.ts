import * as PIXI from "pixi.js";

export default class ErrorMessage extends PIXI.Container {
  constructor(opts: { text: string }) {
    super();

    const textItem = new PIXI.Text(opts.text, {
      fontSize: 30,
      fontVariant: "normal",
      fill: 0xff8080,
    });
    textItem.anchor.set(0.5);

    const graphics = new PIXI.Graphics();
    graphics.beginFill(0x401010);
    graphics.lineStyle(0);
    graphics.drawRect(0, 0, textItem.width + 20, textItem.height + 20);
    graphics.endFill();

    textItem.x = graphics.width / 2;
    textItem.y = graphics.height / 2;

    graphics.addChild(textItem);

    this.addChild(graphics);
  }
}
