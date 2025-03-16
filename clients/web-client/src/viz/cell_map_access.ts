import * as PIXI from 'pixi.js';
import { CellCoord } from "renfrew-river-protocol-client";

export default interface CellMapAccess {
  addChangeListener(listener: (access: CellMapAccess) => void): () => void;
  addHoverCellChangedListener(listener: (cell: CellCoord) => void): () => void;

  topLeftWorld(): PIXI.IPointData;

  screenSize(): { width: number, height: number };
  zoomLevel(): number;

  centerOnNormalScaleWorldPoint(point: Readonly<PIXI.IPointData>): void;
}
