
/**
 * Delays a function call until a certain amount of time has passed
 * since the last time the function was called.
 */
export class DelayLatch<T> {
  private readonly delayMs: number;
  private readonly callback: (arg: T) => void;
  private timeout: Timeout | null = null;

  constructor(delayMs: number, callback: (arg: T) => void) {
    this.delayMs = delayMs;
    this.callback = callback;
  }

  public trigger(arg: T): void {
    if (this.timeout) {
      this.timeout.cancel();
    }
    this.timeout = new Timeout(this.delayMs);
    this.timeout.wait()
      .then(() => { this.callback(arg); })
      .catch(err => {
        if (err === "cancelled") {
          // Ignore
        } else {
          throw err;
        }
      });
  }
}

export class Timeout {
  private timeoutId: NodeJS.Timeout | null = null;
  private readonly promise: Promise<void>;
  private resolve!: () => void;
  private reject!: (reason?: unknown) => void;

  public constructor(delayMs: number) {
    this.promise = new Promise<void>((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
    this.timeoutId = setTimeout(() => {
      this.timeoutId = null;
      this.resolve();
    }, delayMs);
  }

  public cancel(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
      this.reject("cancelled");
    }
  }

  public wait(): Promise<void> {
    return this.promise;
  }
}
