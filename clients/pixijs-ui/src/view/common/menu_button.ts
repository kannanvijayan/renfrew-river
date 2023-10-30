import * as PIXI from "pixi.js";

export type MenuButtonOnClickListener = () => void;

export default class MenuButton extends PIXI.Container {
  private buttonName: string;
  private text: string;
  private graphics: PIXI.Graphics;

  private onClickListener: MenuButtonOnClickListener | null;

  constructor(opts: {
    name: string,
    text: string,
    onClickListener?: MenuButtonOnClickListener,
    width?: number,
    height?: number,
    color?: number,
  }) {
    const { name, text } = opts;
    let { width, height, color } = opts;
    super();

    width ??= 300;
    height ??= 50;
    color ??= 0x408040;
    // LineColor should be darker version of color
    const lineColor = color - 0x202020;

    this.buttonName = name;
    this.text = text;
    this.onClickListener = opts.onClickListener || null;

    this.graphics = new PIXI.Graphics();
    this.graphics.beginFill(color);
    this.graphics.lineStyle(3, lineColor);
    this.graphics.drawRoundedRect(0, 0, width, height, 20);
    this.graphics.endFill();
    this.addChild(this.graphics);

    const textItem = new PIXI.Text(text, {
      fontSize: 20,
      fontVariant: "small-caps",
    });
    textItem.anchor.set(0.5);
    textItem.x = width / 2;
    textItem.y = height / 2;
    this.graphics.addChild(textItem);

    this.graphics.eventMode = "static";
    this.graphics.onmousedown = this.handleMouseDown.bind(this);
    this.graphics.onclick = this.handleClick.bind(this);
  }

  private handleMouseDown(ev: PIXI.FederatedMouseEvent): void {
    ev.stopPropagation();
  }

  private handleClick(ev: PIXI.FederatedMouseEvent): void {
    ev.stopPropagation();
    if (this.onClickListener) {
      this.onClickListener();
    } else {
      console.log("No onClickListener set for MenuButton", this.buttonName);
    }
  }
}