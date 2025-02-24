
/**
 * A timeout with a fixed interval, but which can have its start-time bumped
 * to the current time.
 */
export class BumpTimeout {
  private interval: number;
  private readonly callback: () => void;
  private timeout: number | undefined;

  constructor(interval: number, callback: () => void) {
    this.interval = interval;
    this.callback = callback;
    this.timeout = this.createTimeout();
  }

  public bump(newInterval?: number) {
    if (newInterval !== undefined) {
      this.interval = newInterval;
    }

    // If already triggered, don't bump.
    if (this.timeout === undefined) {
      console.warn("BumpTimeout: bumping already triggered timeout");
      return;
    }
    this.cancelTimeout();
    this.timeout = this.createTimeout();
  }

  public cancel() {
    this.cancelTimeout();
  }

  private cancelTimeout(): boolean {
    if (this.timeout === undefined) {
      return false;
    }
    clearTimeout(this.timeout);
    this.timeout = undefined;
    return true;
  }

  private createTimeout(): number {
    return setTimeout(() => this.triggerTimeout(), this.interval);
  }

  private triggerTimeout() {
    this.timeout = undefined;
    this.callback();
  }
}
