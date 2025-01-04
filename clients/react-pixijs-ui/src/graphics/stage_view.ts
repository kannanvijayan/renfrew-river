import * as PIXI from 'pixi.js';
import ViewObserver from '../ViewObserver';

/**
 * Base class for stage views.
 */
export default class StageView extends PIXI.Container {
  protected readonly viewObserver_: ViewObserver;

  protected backplane: PIXI.Graphics;

  private removeResizeListener: () => unknown;

  constructor(opts: { viewObserver: ViewObserver }) {
    super();
    this.viewObserver_ = opts.viewObserver;
    this.backplane = new PIXI.Graphics();

    this.initBackplane();

    this.removeResizeListener = this.viewObserver_.addResizeListener(
      (width, height) => this.handleResize(width, height)
    );
  }

  public shutdown() {
    this.removeResizeListener();
  }

  private handleResize(width: number, height: number): void {
    this.preResize(width, height);

    this.removeChild(this.backplane);
    this.backplane = new PIXI.Graphics();
    this.initBackplane();

    this.postResize(width, height);
  }

  // Override these in subclasses to do shutdown before and setup after
  // base class redraws.
  protected preResize(_width: number, _height: number) {}
  protected postResize(_width: number, _height: number) {}

  private initBackplane(): void {
    this.backplane.beginFill(0x000000);
    this.backplane.drawRect(
      0, 0,
      this.viewObserver_.areaWidth,
      this.viewObserver_.areaHeight
    );
    this.backplane.endFill();
    this.addChild(this.backplane);
  }
}
