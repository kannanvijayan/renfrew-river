import * as PIXI from 'pixi.js';

/**
 * This class mostly exists to provide a convenient non-visible
 * graphic element onto which we can bind mouse events.
 */
export default class Backplane extends PIXI.Container {
  protected rect: PIXI.Graphics;

  constructor(width: number, height: number) {
    super();
    this.rect = new PIXI.Graphics();
    this.initBackplane(width, height);
  }

  public resize(width: number, height: number): void {
    this.removeChild(this.rect);
    this.rect = new PIXI.Graphics();
    this.initBackplane(width, height);
  }

  private initBackplane(width: number, height: number): void {
    this.rect.beginFill(0x000000);
    this.rect.drawRect(0, 0, width, height);
    this.rect.endFill();
    this.addChild(this.rect);
  }
}
