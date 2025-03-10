import {
  CellCoord,
  GenerationCellDatumId,
  WorldDims,
} from "renfrew-river-protocol-client";

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
    this.array = array ? array : new arrayType(this.dims.rows * this.dims.columns);
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
    topLeft: CellCoord,
    dims: WorldDims,
    index: |0|1|2|3,
    src: MapDataBase,
  }): void {
    const { topLeft, dims, index, src } = opts;
    if (src.size !== 1) {
      throw new Error("MapDataBase.inject2D: can only inject size-1 maps");
    }
    if (this.dataType !== src.dataType) {
      throw new Error("MapDataBase.write2D: data type mismatch");
    }
    const dstArray = this.array;
    const srcArray = src.array;
    this.write2DWith(topLeft, dims, 1, offset => {
      // Ignore srcIdx since we're copying from a same-sized buffer.
      dstArray[offset + index] = srcArray[offset];
    });
  }

  public write2D(opts: {
    topLeft: CellCoord,
    dims: WorldDims,
    data: MapDataBase,
  }): void {
    const { topLeft, dims, data } = opts;

    if (this.size !== data.size) {
      throw new Error("MapDataBase.write2D: size mismatch");
    }
    if (this.dataType !== data.dataType) {
      throw new Error("MapDataBase.write2D: data type mismatch");
    }
    const dst = this.array;
    const src = data.array;
    this.write2DWith(topLeft, dims, data.size, (dstIdx, srcIdx) => {
      for (let i = 0; i < this.size && i < data.size; i++) {
        dst[dstIdx + i] = src[srcIdx + i];
      }
    });
  }

  private write2DWith(
    topLeft: CellCoord,
    dims: WorldDims,
    srcSize: ValidSize,
    callback: (dstIdx: number, srcIdx: number) => void,
  ): void {
    for (let j = 0; j < dims.rows; j++) {
      const dstj = ((topLeft.row + j) * this.dims.columns + topLeft.col);
      const srcj = (j * dims.columns);
      for (let i = 0; i < dims.columns; i++) {
        const dsti = (dstj + i) * this.size;
        const srci = (srcj + i) * srcSize;
        callback(dsti, srci);
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
}

export class MapDataSet {
  private readonly worldDims: WorldDims;
  private readonly observedDatumIds: GenerationCellDatumId[];
  private readonly visualizedDatumIds: [
    GenerationCellDatumId | null,
    GenerationCellDatumId | null,
    GenerationCellDatumId | null,
    GenerationCellDatumId | null,
  ] = [ null, null, null, null ];

  // The underlying typed array data that is updated from network.
  private readonly dataMaps: Map<string, MapData<"uint32", 1>>;

  // A single f32x4 typed array that is used as a texture input
  // for the shader.
  private readonly textureMapData: MapData<"float32", 4>;

  public constructor(worldDims: WorldDims) {
    this.worldDims = worldDims;
    this.observedDatumIds = [];
    this.dataMaps = new Map();
    this.textureMapData = new MapData({
      dataType: "float32",
      size: 4,
      dims: worldDims
    });
  }

  public getObservedDatumIds(): GenerationCellDatumId[] {
    return [...this.observedDatumIds];
  }

  public setObservedDatumIds(datumIds: GenerationCellDatumId[]): void {
    this.observedDatumIds.splice(0, this.observedDatumIds.length, ...datumIds);
    this.dataMaps.clear();
    for (const datumId of datumIds) {
      this.ensureDataMap(datumId);
    }
  }

  public setVisualizedDatumId(
    index: number,
    datumId: GenerationCellDatumId | null,
  ): void {
    if (index < 0 || index >= this.visualizedDatumIds.length) {
      throw new Error("MapDataSet.setVisualizedDatumId: index out of range");
    }
    this.visualizedDatumIds[index] = datumId;
  }

  public getDataMap(datumId: GenerationCellDatumId): MapData {
    const datumKey = GenerationCellDatumId.toStringKey(datumId);
    const dataMap = this.dataMaps.get(datumKey);
    if (!dataMap) {
      throw new Error("MapDataSet.getDataMap: data map not found");
    }
    return dataMap;
  }

  public writeDataMap(args: {
    datumId: GenerationCellDatumId,
    topLeft: CellCoord,
    data: MapData<"uint32", 1>,
  }): void {
    const { datumId, topLeft, data } = args;
    const dims = data.dims;
    const dataMap = this.getDataMap(datumId);
    dataMap.write2D({
      topLeft,
      dims,
      data,
    });

    this.visualizedDatumIds.forEach((vizDatumId, index) => {
      if (vizDatumId && GenerationCellDatumId.equal(datumId, vizDatumId)) {
        this.syncTextureData(vizDatumId, index as |0|1|2|3, topLeft, dims);
      }
    });
  }

  private syncTextureData(
    datumId: GenerationCellDatumId,
    index: |0|1|2|3,
    topLeft: CellCoord,
    dims: WorldDims,
  ): void {
    const mapData = this.getDataMap(datumId);
    this.textureMapData.inject2D({
      topLeft,
      dims,
      index,
      src: mapData,
    });
  }

  private ensureDataMap(datumId: GenerationCellDatumId): MapData {
    const key = GenerationCellDatumId.toStringKey(datumId);
    let dataMap = this.dataMaps.get(key);
    if (dataMap) {
      throw new Error("MapDataSet.createDataMap: data map already exists");
    }
    dataMap = new MapData({
      dataType: "int32",
      size: 1,
      dims: this.worldDims,
    });
    this.dataMaps.set(key, dataMap);
    return dataMap;
  }
}

export type ReadMapDataCallback = (args: {
  topLeft: CellCoord,
  dims: WorldDims,
  datumIds: GenerationCellDatumId[]
}) => Promise<MapData[]>;

export type ReadMiniMapDataCallback = (args: {
  miniDims: WorldDims,
  datumIds: GenerationCellDatumId[]
}) => Promise<MapData[]>;
