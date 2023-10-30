
/**
 * SetTimeout promise.
 */
export function awaitTimeout(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Measure the execution time of a function.
 */
export async function measureAsyncTime<T>(
  fn: () => Promise<T>,
  intervalHandler: (timeMs: number) => void
): Promise<T> {
  const start = Date.now();
  const result = await fn();
  const end = Date.now();
  intervalHandler(end - start);
  return result;
}