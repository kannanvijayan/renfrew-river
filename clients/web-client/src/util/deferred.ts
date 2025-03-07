
type DeferredResolve<T> = T extends void ? () => void : (value: T) => void;
type DeferredReject = (err: Error) => void;

export default class Deferred<T> {
  private readonly promise: Promise<T>;
  private readonly resolve: DeferredResolve<T>;
  private readonly reject: DeferredReject;

  constructor() {
    let resolve: DeferredResolve<T>;
    let reject: DeferredReject;
    this.promise = new Promise((res, rej) => {
      resolve = res as DeferredResolve<T>;
      reject = rej;
    });
    this.resolve = resolve!;
    this.reject = reject!;
  }

  public resolvePromise(value: T): void {
    this.resolve(value);
  }

  public rejectPromise(err: Error): void {
    this.reject(err);
  }

  public getPromise(): Promise<T> {
    return this.promise;
  }
}
