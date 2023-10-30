export default class Deferred<T> {
  private readonly promise: Promise<T>;
  private readonly resolve: T extends void ? () => void : (value: T) => void;
  private readonly reject: (err: Error) => void;

  constructor() {
    let resolve: any;
    let reject: any;
    this.promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    this.resolve = resolve;
    this.reject = reject;
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