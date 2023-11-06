const MIN_COLUMNS = 128;
const MIN_ROWS = 128;

const MAX_COLUMNS = 8192;
const MAX_ROWS = 8192;

export type WorldDims = {
  columns: number;
  rows: number;
};

export const WorldDims = {
  Limits: {
    minColumns: MIN_COLUMNS,
    minRows: MIN_ROWS,
    maxColumns: MAX_COLUMNS,
    maxRows: MAX_ROWS,
  },
}
