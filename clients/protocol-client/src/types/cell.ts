
/** A cell coordinate. */
type CellCoord = {
  row: number,
  col: number,
};

/** A cell word. */
type CellWordName = string;

/** A cell word component. */
type CellComponentName = string;

/** A selector for a cell component. */
type CellComponentSelector = {
  word: CellWordName,
  component: CellComponentName,
};

export { CellCoord, CellWordName, CellComponentName, CellComponentSelector };
