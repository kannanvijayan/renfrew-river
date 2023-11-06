import * as PIXI from 'pixi.js';
import { CellCoord } from '../../game/types/cell_coord';

/**
 * The normalized scale of a tile that we base all calculations on.
 * E.g. when zoomed, we do calculations using the normal scale tiling
 * and then scale the result to the zoom level.
 */
export const NORMAL_SCALE_TILE = {
  width: 200,
  height: 200,
  mulWidth: 200 * 3 / 4,
  mulHeight: 200,
};

export function normalOffsetXForTile(column: number, _row: number): number {
  return (column * NORMAL_SCALE_TILE.mulWidth);
}
export function normalOffsetYForTile(column: number, row: number): number {
  return (
    (row * NORMAL_SCALE_TILE.mulHeight) +
    ((column % 2) * (NORMAL_SCALE_TILE.height / 2))
  );
}

export function tileFromNormalOffset(x: number, y: number)
  : CellCoord
{
  const col = Math.floor(x / NORMAL_SCALE_TILE.mulWidth);
  const row = Math.floor(
    (y - ((col % 2) * (NORMAL_SCALE_TILE.height / 2)))
      / NORMAL_SCALE_TILE.mulHeight
  );
  return { col, row };
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
export const HEX_COORDS: Record<HexPointNames, PIXI.IPointData> = {
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
export const HEX_POINTS: PIXI.IPointData[] = Object.values(HEX_COORDS);

/**
 * PIXI polygon for a hexagon, scaled by 100
 */
export const HEX_POLYGON_100: PIXI.Polygon =
  new PIXI.Polygon(HEX_POINTS.map(p => new PIXI.Point(p.x * 100, p.y * 100)));


function unitScreenCoordToClipCoord(simpleCoord: PIXI.IPointData): PIXI.IPointData {
  const { x, y } = simpleCoord;
  return {
    x: (x - 0.5) * NORMAL_SCALE_TILE.width,
    y: -(y - 0.5) * NORMAL_SCALE_TILE.height,
  };
}

/**
 * Hex points in clip coordinate system.
 */
export const HEX_POINTS_CLIP_COORDS: Record<HexPointNames, PIXI.IPointData> = {
  topLeft: unitScreenCoordToClipCoord(HEX_COORDS.topLeft),
  topRight: unitScreenCoordToClipCoord(HEX_COORDS.topRight),
  right: unitScreenCoordToClipCoord(HEX_COORDS.right),
  bottomRight: unitScreenCoordToClipCoord(HEX_COORDS.bottomRight),
  bottomLeft: unitScreenCoordToClipCoord(HEX_COORDS.bottomLeft),
  left: unitScreenCoordToClipCoord(HEX_COORDS.left),
};

export function pointDataToArray(pointData: PIXI.IPointData): number[] {
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
