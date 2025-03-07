import * as PIXI from 'pixi.js';
import { CellCoord } from "renfrew-river-protocol-client";

/**
 * The normalized scale of a cell that we base all calculations on.
 * E.g. when zoomed, we do calculations using the normal scale tiling
 * and then scale the result to the zoom level.
 */
export const NORMAL_SCALE_CELL = {
  width: 1,
  height: 1,
  mulWidth: 3 / 4,
  mulHeight: 1,
};

export function normalOffsetXForCellBoundingBox(column: number): number {
  return (column * NORMAL_SCALE_CELL.mulWidth);
}
export function normalOffsetYForCellBoundingBox(
  column: number,
  row: number
): number {
  return (
    (row * NORMAL_SCALE_CELL.mulHeight) +
    ((column % 2) * (NORMAL_SCALE_CELL.height / 2))
  );
}

/**
 * The rectified bounding box of a cell looks like this:
 *
 * +-----==========+
 * |    /          |\
 * |   /           | \
 * |  /            |  \
 * | /             |   \
 * |/              |    \
 * |\              |    /
 * | \             |   /
 * |  \            |  /
 * |   \           | /
 * |    \          |/
 * +-----==========+
 */
export function rectifiedBoundingBoxCellFromNormalOffset(x: number, y: number)
  : CellCoord
{
  const { height, mulWidth, mulHeight } = NORMAL_SCALE_CELL;
  const col = Math.floor(x / mulWidth);
  const oddColumn = col & 1;
  const columnShift = oddColumn * (height / 2);
  const row = Math.floor((y - columnShift) / mulHeight);
  return { col, row };
}

export function hexCellUnderNormalOffset(x: number, y: number): CellCoord {
  const { height, width, mulWidth, mulHeight } = NORMAL_SCALE_CELL;
  const bbCol = Math.floor(x / mulWidth);
  const oddColumn = bbCol & 1;
  const columnShift = oddColumn * (NORMAL_SCALE_CELL.height / 2);
  const bbRow = Math.floor((y - columnShift) / mulHeight);

  const xOffset = x - (bbCol * mulWidth);
  const yOffset = y - ((bbRow * mulHeight) + columnShift + (height / 2));

  const slope = (width / 4) / (height / 2);
  const ratio = xOffset / yOffset;
  const result = { col: bbCol, row: bbRow };
  if (yOffset < 0) {
    // Top half.
    if (ratio >= -slope) {
      result.col = bbCol - 1;
      result.row = bbRow - (1 - oddColumn);
    }
  } else {
    // Bottom half.
    if (ratio < slope) {
      result.col = bbCol - 1;
      result.row = bbRow + oddColumn;
    }
  }
  return result;
}

/**
 * Names for each point in a hexagon.
 */
export type HexPointNames =
  | 'topLeft'
  | 'topRight'
  | 'right'
  | 'bottomRight'
  | 'bottomLeft'
  | 'left';

/**
 * Point coordinates of a hexagon within a unit-1 square.
 */
export const HEX_COORDS: Record<HexPointNames, PIXI.PointData> = {
  topLeft: { x: 0.25, y: 0 },
  topRight: { x: 0.75, y: 0 },
  right: { x: 1, y: 0.5 },
  bottomRight: { x: 0.75, y: 1 },
  bottomLeft: { x: 0.25, y: 1 },
  left: { x: 0, y: 0.5 },
};

/**
 * Points for a hexagon in an array.
 */
export const HEX_POINTS: PIXI.PointData[] = Object.values(HEX_COORDS);

/**
 * PIXI polygon for a hexagon, scaled by 100
 */
export const HEX_POLYGON_100: PIXI.Polygon =
  new PIXI.Polygon(HEX_POINTS.map(p => new PIXI.Point(p.x * 100, p.y * 100)));


function unitScreenCoordToClipCoord(simpleCoord: PIXI.PointData): PIXI.PointData {
  const { x, y } = simpleCoord;
  return {
    x: (x - 0.5) * NORMAL_SCALE_CELL.width,
    y: -(y - 0.5) * NORMAL_SCALE_CELL.height,
  };
}

/**
 * Hex points in clip coordinate system.
 */
export const HEX_POINTS_CLIP_COORDS: Record<HexPointNames, PIXI.PointData> = {
  topLeft: unitScreenCoordToClipCoord(HEX_COORDS.topLeft),
  topRight: unitScreenCoordToClipCoord(HEX_COORDS.topRight),
  right: unitScreenCoordToClipCoord(HEX_COORDS.right),
  bottomRight: unitScreenCoordToClipCoord(HEX_COORDS.bottomRight),
  bottomLeft: unitScreenCoordToClipCoord(HEX_COORDS.bottomLeft),
  left: unitScreenCoordToClipCoord(HEX_COORDS.left),
};

export function pointDataToArray(pointData: PIXI.PointData): number[] {
  return [pointData.x, pointData.y];
}

export const HEX_TRIANGLES_CLIP = {
  north: [
    0, 0,
    ...pointDataToArray(HEX_POINTS_CLIP_COORDS.topLeft),
    ...pointDataToArray(HEX_POINTS_CLIP_COORDS.topRight),
  ],

  northeast: [
    0, 0,
    ...pointDataToArray(HEX_POINTS_CLIP_COORDS.topRight),
    ...pointDataToArray(HEX_POINTS_CLIP_COORDS.right),
  ],

  southeast: [
    0, 0,
    ...pointDataToArray(HEX_POINTS_CLIP_COORDS.right),
    ...pointDataToArray(HEX_POINTS_CLIP_COORDS.bottomRight),
  ],

  south: [
    0, 0,
    ...pointDataToArray(HEX_POINTS_CLIP_COORDS.bottomRight),
    ...pointDataToArray(HEX_POINTS_CLIP_COORDS.bottomLeft),
  ],

  southwest: [
    0, 0,
    ...pointDataToArray(HEX_POINTS_CLIP_COORDS.bottomLeft),
    ...pointDataToArray(HEX_POINTS_CLIP_COORDS.left),
  ],

  northwest: [
    0, 0,
    ...pointDataToArray(HEX_POINTS_CLIP_COORDS.left),
    ...pointDataToArray(HEX_POINTS_CLIP_COORDS.topLeft),
  ],
};
