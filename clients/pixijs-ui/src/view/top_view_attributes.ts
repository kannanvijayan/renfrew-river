
export default class TopViewAttributes {
  public areaWidth: number;
  public areaHeight: number;

  private readonly resizeListeners: Array<GameViewResizeListener>;

  public constructor(opts: {
    areaWidth: number,
    areaHeight: number,
  }) {
    this.areaWidth = opts.areaWidth;
    this.areaHeight = opts.areaHeight;
    this.resizeListeners = [];
  }

  public resize(width: number, height: number): void {
    this.areaWidth = width;
    this.areaHeight = height;
    this.resizeListeners.forEach(listener => {
      listener(width, height);
    });
  }

  public addResizeListener(listener: GameViewResizeListener)
    : RemoveListener<GameViewResizeListener>
  {
    this.resizeListeners.push(listener);
    return () => {
      this.removeResizeListener(listener);
      return listener;
    };
  }
  private removeResizeListener(listener: GameViewResizeListener) {
    const index = this.resizeListeners.indexOf(listener as any);
    if (index >= 0) {
      this.resizeListeners.splice(index, 1);
    }
  }
}

export type RemoveListener<T> = () => T;
export type GameViewResizeListener = (width: number, height: number) => void;