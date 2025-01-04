
export default interface ViewObserver {
  readonly areaWidth: number;
  readonly areaHeight: number;

  resize(width: number, height: number): void;

  addResizeListener(listener: ViewObserverResizeListener)
    : ViewObserverRemoveListener<ViewObserverResizeListener>;
}

export function makeViewObserver(opts: {
  areaWidth: number,
  areaHeight: number,
}): ViewObserver {
  return new ViewObserverImpl(opts);
}

class ViewObserverImpl implements ViewObserver {
  public areaWidth: number;
  public areaHeight: number;

  private readonly resizeListeners: Array<ViewObserverResizeListener>;

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

  public addResizeListener(listener: ViewObserverResizeListener)
    : ViewObserverRemoveListener<ViewObserverResizeListener>
  {
    this.resizeListeners.push(listener);
    return () => {
      this.removeResizeListener(listener);
      return listener;
    };
  }
  private removeResizeListener(listener: ViewObserverResizeListener) {
    const index = this.resizeListeners.indexOf(listener);
    if (index >= 0) {
      this.resizeListeners.splice(index, 1);
    }
  }
}

export type ViewObserverRemoveListener<T> = () => T;
export type ViewObserverResizeListener = (width: number, height: number) => void;
