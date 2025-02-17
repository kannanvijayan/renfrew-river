
/**
 * Given some structural type, the corresponding validation type associates
 * each element and sub-element with its own validation info.
 */
export type ValidationInfo<T> =
    T extends Record<string, unknown> ?
      {
        valid: boolean,
        properties: { [K in keyof T]: ValidationInfo<T[K]> }
      }
  : T extends Array<unknown> ?
      {
        valid: boolean,
        elements: ValidationInfo<T[number]>[]
      }
  : T extends string | number | boolean | null | undefined ?
      {
        valid: boolean,
        message: string,
      }
  : never;
