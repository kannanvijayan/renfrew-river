import { CellCoord } from "./types/cell_coord";
import { WorldDims } from "./types/world_dims";

type TypedArrayConstructor = 
  | Uint8ArrayConstructor
  | Uint16ArrayConstructor
  | Uint32ArrayConstructor;

type TypedArray =
  | Uint8Array
  | Uint16Array
  | Uint32Array;

export type MapDataArrayType = "uint8" | "uint16" | "uint32";
const MapDataArrayClass: Record<MapDataArrayType, TypedArrayConstructor> = {
  uint8: Uint8Array,
  uint16: Uint16Array,
  uint32: Uint32Array,
};

/**
 * Convenience class to store various data mapped by coordinates.
 */
export default class MapData<T extends MapDataArrayType> {
  public readonly dims: WorldDims;
  public readonly array: TypedArray;

  constructor(dataType: T, dims: WorldDims) {
    this.dims = dims;
    const arrayType = MapDataArrayClass[dataType];
    this.array = new arrayType(this.dims.rows * this.dims.columns);
  }

  public valueAt(x: number, y: number): number {
    return this.array[y * this.dims.columns + x];
  }

  public write2D(opts: {
    topLeft: CellCoord,
    area: WorldDims,
    genValue: (x: number, y: number) => number,
  }): void {
    const { topLeft, area, genValue } = opts;
    for (let j = 0; j < area.rows; j++) {
      const yj = (topLeft.row + j) * this.dims.columns;
      for (let i = 0; i < area.columns; i++) {
        this.array[yj + topLeft.col + i] = genValue(i, j)
      }
    }
  }
}