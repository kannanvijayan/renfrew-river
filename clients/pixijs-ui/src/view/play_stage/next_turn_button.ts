import * as PIXI from "pixi.js";

export type NextTurnButtonOnClickListener = () => void;

export default class NextTurnButton extends PIXI.Container {
  private graphics: PIXI.Graphics;

  private onClickListener: NextTurnButtonOnClickListener | null;

  constructor(opts: {
    onClickListener?: NextTurnButtonOnClickListener,
    width?: number,
    height?: number,
    color?: number,
  }) {
    let { width, height, color } = opts;
    super();

    width ??= 100;
    height ??= 100;
    color ??= 0x408040;
    const lineColor = color - 0x202020;

    const bgColor = 0x202020;
    const padding = 10;

    this.onClickListener = opts.onClickListener || null;

    // Draw background.
    this.graphics = new PIXI.Graphics();
    this.graphics.beginFill(bgColor);
    this.graphics.lineStyle(0);
    this.graphics.drawRect(0, 0, width, height);
    this.graphics.endFill();

    // Draw a right-pointing triangle.
    this.graphics.beginFill(color);
    this.graphics.lineStyle(3, lineColor);
    this.graphics.drawPolygon([
      {x: padding, y: padding},
      {x: width - padding, y: height / 2},
      {x: padding, y: height - padding},
    ]);
    this.graphics.endFill();
    this.addChild(this.graphics);

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
      console.log("No onClickListener set for NextTurnButton");
    }
  }
}
