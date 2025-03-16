import {
  CellCoord,
  GenerationCellDatumId,
  WorldDims,
} from "renfrew-river-protocol-client";
import { DatumVizIndex } from "../../viz/datum";

export type MapDataArrayType =
  | "uint8" | "uint16" | "uint32"
  | "int8" | "int16" | "int32"
  | "float32";

type MapDataArrayClass = {
  uint8: Uint8Array,
  uint16: Uint16Array,
  uint32: Uint32Array,
  int8: Int8Array,
  int16: Int16Array,
  int32: Int32Array,
  float32: Float32Array,
};
const MapDataArrayClass = {
  uint8: Uint8Array,
  uint16: Uint16Array,
  uint32: Uint32Array,
  int8: Int8Array,
  int16: Int16Array,
  int32: Int32Array,
  float32: Float32Array,
} as const;

type TypedArray =
  | Uint8Array | Uint16Array | Uint32Array
  | Int8Array | Int16Array | Int32Array
  | Float32Array;

type ValidSize = |1|4;

/**
 * Unspecialized abstarct base class for map data.
 */
export class MapDataBase {
  public readonly dataType: MapDataArrayType;
  public readonly size: ValidSize;
  public readonly dims: WorldDims;
  public readonly array: TypedArray;

  constructor(args: {
    dataType: MapDataArrayType,
    size: ValidSize,
    dims: WorldDims,
    array?: TypedArray,
  }) {
    const { dataType, size, dims, array } = args;
    this.dataType = dataType;
    this.size = size;
    this.dims = dims;
    const arrayType = MapDataArrayClass[dataType];
    if (array && array.length != (dims.rows * dims.columns * size)) {
      throw new Error(
        `MapDataBase: array length mismatch: ${array.length} != ${dims.rows * dims.columns * size}`
      );
    }
    this.array = array ?? new arrayType(dims.rows * dims.columns * size);
  }

  public valueAt(x: number, y: number): number | [number, number, number, number] {
    const idx = (y * this.dims.columns + x) * this.size;
    const arr = this.array;
    if (this.size === 1) {
      return arr[idx];
    } else if (this.size === 4) {
      return [ arr[idx], arr[idx + 1], arr[idx + 2], arr[idx + 3] ];
    } else {
      throw new Error("MapDataBase.valueAt: invalid size");
    }
  }

  public inject2D(opts: {
    srcTopLeft: CellCoord,
    dstTopLeft: CellCoord,
    copyDims: WorldDims,
    srcVizIndex: DatumVizIndex,
    dstVizIndex: DatumVizIndex,
    src: MapDataBase,
    range: [number, number],
  }): void {
    const { srcTopLeft, dstTopLeft, copyDims, srcVizIndex, dstVizIndex, src, range } = opts;
    if (src.size !== 1) {
      throw new Error("MapDataBase.inject2D: can only inject size-1 maps");
    }
    const dstArray = this.array;
    const srcArray = src.array;
    this.write2DWith({
      srcTopLeft,
      dstTopLeft,
      srcDims: src.dims,
      copyDims,
      srcSize: src.size,
      callback: (dstIndex, srcIndex) => {
        const value = srcArray[srcIndex + srcVizIndex];
        // Scale the value to [0, 1).
        const scale = 1.0 / (range[1] - range[0]);
        const scaledValue = (value - range[0]) * scale;
        dstArray[dstIndex + dstVizIndex] = scaledValue;
      },
    });
  }

  public write2D(opts: {
    srcTopLeft: CellCoord,
    dstTopLeft: CellCoord,
    copyDims: WorldDims,
    src: MapDataBase,
    srcVizIndex: DatumVizIndex,
    dstVizIndex: DatumVizIndex,
    transform?: (elt: number) => number,
  }): void {
    const {
      srcTopLeft,
      dstTopLeft,
      copyDims,
      src,
      srcVizIndex,
      dstVizIndex,
      transform,
    } = opts;
    const dstArray = this.array;
    const srcArray = src.array;
    this.write2DWith({
      srcTopLeft,
      dstTopLeft,
      srcDims: src.dims,
      copyDims,
      srcSize: src.size,
      callback: (transform ?
        (dstIdx, srcIdx) => {
          dstArray[dstIdx + dstVizIndex] = transform(
            srcArray[srcIdx + srcVizIndex]
          );
        }
      : (dstIdx, srcIdx) => {
          dstArray[dstIdx + dstVizIndex] = srcArray[srcIdx + srcVizIndex];
        }
      ),
    });
  }

  private write2DWith(args: {
    srcTopLeft: CellCoord,
    dstTopLeft: CellCoord,
    srcDims: WorldDims,
    copyDims: WorldDims,
    srcSize: ValidSize,
    callback: (dstIdx: number, srcIdx: number, column: number, row: number) => void,
  }): void {
    const { srcTopLeft, dstTopLeft, srcDims, copyDims, srcSize, callback } = args;
    for (let j = 0; j < copyDims.rows; j++) {
      const dstj = (dstTopLeft.row + j) * this.dims.columns + dstTopLeft.col;
      const srcj = ((srcTopLeft.row + j) * srcDims.columns) + srcTopLeft.col;
      for (let i = 0; i < copyDims.columns; i++) {
        const dsti = (dstj + i) * this.size;
        const srci = (srcj + i) * srcSize;
        callback(dsti, srci, i, j);
      }
    }
  }
}

/**
 * Convenience class to store various data mapped by coordinates.
 */
export default class MapData<
  T extends MapDataArrayType = MapDataArrayType,
  N extends ValidSize= 1,
>
  extends MapDataBase
{
  constructor(args: {
    dataType: T,
    size: N,
    dims: WorldDims,
    array?: MapDataArrayClass[T],
  }) {
    super(args);
  }

  public valueAt(x: number, y: number)
    : (N extends 1 ? number : [number, number, number, number])
  {
    return (
      super.valueAt(x, y) as
        (N extends 1 ? number : [number, number, number, number])
    );
  }

  public getArray(): MapDataArrayClass[T] {
    return this.array as MapDataArrayClass[T];
  }
}

export type ReadMapDataCallback = (args: {
  topLeft: CellCoord,
  dims: WorldDims,
  datumIds: GenerationCellDatumId[]
}) => Promise<MapData<"uint32", 1>[]>;

export type ReadMiniMapDataCallback = (args: {
  miniDims: WorldDims,
  datumId: GenerationCellDatumId,
}) => Promise<MapData<"uint32", 1>>;
