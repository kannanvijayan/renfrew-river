
export type FunctionObject<
  A extends Array<unknown>,
  R,
  O extends { [key: string]: unknown },
> = { (...args: A): R } & O;

export function functionObject<
  A extends Array<unknown>,
  R,
  O extends { [key: string]: unknown },
>(fn: (...args: A) => R, obj: O): FunctionObject<A, R, O>
{
  const wrappedFn = (...args: A) => fn(...args);
  for (const key in obj) {
    (wrappedFn as unknown as Record<string, unknown>)[key] = obj[key];
  }
  return wrappedFn as FunctionObject<A, R, O>;
}
