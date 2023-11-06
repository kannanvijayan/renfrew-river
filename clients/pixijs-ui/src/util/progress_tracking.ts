
/**
 * A progress summary is a generic way for one component to tell
 * another component about progress it is making accomplishing
 * some task or set of tasks.
 */
export type ProgressInfo = {
  /** The label of the progressing action. */
  label: string;

  /** The total this step needs to reach. */
  total: number;

  /** The current progress of this step. */
  current: number;
};

export type ProgressCallback = (info: ProgressInfo) => unknown;
