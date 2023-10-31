import { CellCoord } from "./types/cell_coord";
import { WorldDims } from "./types/world_dims";

export type MapDataArrayType = "uint8" | "uint16" | "uint32";
const MapDataArrayClass: Record<MapDataArrayType, any> = {
  uint8: Uint8Array,
  uint16: Uint16Array,
  uint32: Uint32Array,
};
type MapDataArrayClassType = {
  uint8: Uint8Array,
  uint16: Uint16Array,
  uint32: Uint32Array,
};

/**
 * Convenience class to store various data mapped by coordinates.
 */
export default class MapData<T extends MapDataArrayType> {
  public readonly dims: WorldDims;
  public readonly array: typeof MapDataArrayClass[T];

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
      let yj = (topLeft.row + j) * this.dims.columns;
      for (let i = 0; i < area.columns; i++) {
        this.array[yj + topLeft.col + i] = genValue(i, j)
      }
    }
  }
}