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
    topLeft: CellCoord,
    dims: WorldDims,
    index: DatumVizIndex,
    src: MapDataBase,
    range: [number, number],
  }): void {
    console.log("KVKV MapDataBase.inject2D", { ...opts });
    const { topLeft, dims, index, src, range } = opts;
    if (src.size !== 1) {
      throw new Error("MapDataBase.inject2D: can only inject size-1 maps");
    }
    const dstArray = this.array;
    const srcArray = src.array;
    this.write2DWith(topLeft, dims, 1, offset => {
      // Ignore srcIdx since we're copying from a same-sized buffer.
      const value = srcArray[offset];
      // Scale the value to [0, 1).
      const scale = 1.0 / (range[1] - range[0]);
      const scaledValue = (value - range[0]) * scale;
      dstArray[offset + index] = scaledValue;
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

  public getArray(): MapDataArrayClass[T] {
    return this.array as MapDataArrayClass[T];
  }
}

export class MapDataSet {
  private readonly worldDims: WorldDims;
  private readonly observedDatumIds: GenerationCellDatumId[];
  private readonly visualizedDatumIndexes: [
    number | null,
    number | null,
    number | null,
    number | null,
  ] = [ null, null, null, null ];

  // The underlying typed array data that is updated from network.
  private readonly dataMaps: Map<string, MapData<"uint32", 1>>;

  // A single f32x4 typed array that is used as a texture input
  // for the shader.
  private readonly textureSource: MapData<"float32", 4>;

  // To handle texture updates.
  private readonly textureUpdateListeners: (() => void)[];

  public constructor(worldDims: WorldDims) {
    this.worldDims = worldDims;
    this.observedDatumIds = [];
    this.dataMaps = new Map();
    this.textureSource = new MapData({
      dataType: "float32",
      size: 4,
      dims: worldDims
    });
    this.textureUpdateListeners = [];
  }

  public getObservedDatumIds(): GenerationCellDatumId[] {
    return [...this.observedDatumIds];
  }

  public setObservedDatumIds(datumIds: GenerationCellDatumId[]): void {
    this.observedDatumIds.splice(0, this.observedDatumIds.length, ...datumIds);
    this.dataMaps.clear();
    this.visualizedDatumIndexes.fill(null);
    for (const datumId of datumIds) {
      this.ensureDataMap(datumId);
    }
  }

  public setVisualizedDatumId(index: number, datumIndex: number): "updated"|"exists" {
    if (index < 0 || index >= this.visualizedDatumIndexes.length) {
      throw new Error("MapDataSet.setVisualizedDatumId: index out of range");
    }
    if (this.visualizedDatumIndexes[index] === datumIndex) {
      return "exists";
    } else {
      this.visualizedDatumIndexes[index] = datumIndex;
      return "updated";
    }
  }

  public getTextureSource(): MapData<"float32", 4> {
    return this.textureSource;
  }

  public getDataMap(datumId: GenerationCellDatumId): MapData {
    const datumKey = GenerationCellDatumId.toStringKey(datumId);
    const dataMap = this.dataMaps.get(datumKey);
    if (!dataMap) {
      throw new Error("MapDataSet.getDataMap: data map not found");
    }
    return dataMap;
  }

  public addTextureUpdateListener(listener: () => void): () => void {
    this.textureUpdateListeners.push(listener);
    return () => this.removeTextureUpdateListener(listener);
  }

  private removeTextureUpdateListener(listener: () => void): void {
    const index = this.textureUpdateListeners.indexOf(listener);
    if (index < 0) {
      console.error("WorldElevationsTiled.removeTextureUpdateListener: listener not found");
      return;
    }
    this.textureUpdateListeners.splice(index, 1);
  }

  public writeDataMap(args: {
    datumId: GenerationCellDatumId,
    topLeft: CellCoord,
    data: MapData<"uint32", 1>,
  }): void {
    const { datumId, topLeft, data } = args;
    const dims = data.dims;

    console.debug("KVKV writeDataMap BEGIN", { datumId, topLeft, dims });

    // Write it to the datum-id specific map.
    const dataMap = this.getDataMap(datumId);
    dataMap.write2D({
      topLeft,
      dims,
      data,
    });

    // Write any visualized datum id values to the texture map.
    console.debug("KVKV writeDataMap CHECK visualizedDatumIndexes", {
      visualizedDatumIndexes: this.visualizedDatumIndexes,
      observedDatumIds: this.observedDatumIds,
    });
    this.visualizedDatumIndexes.forEach((datumIndex, vizIndex) => {
      if (datumIndex === null) {
        return;
      }
      const vizDatumId = this.observedDatumIds[datumIndex];
      if (vizDatumId === undefined) {
        throw new Error("MapDataSet.writeDataMap: visualized datum id not found");
      }
      if (GenerationCellDatumId.equal(datumId, vizDatumId)) {
        console.debug("KVKV writeDataMap - SyncTextureData", {
          datumId,
          topLeft,
          dims,
          vizDatumId,
          vizIndex,
        });
        this.syncTextureData({
          datumId: vizDatumId,
          index: vizIndex as DatumVizIndex,
          topLeft,
          dims
        });
      }
    });
  }

  public reinjectTextureData(): void {
    this.visualizedDatumIndexes.forEach((datumIndex, vizIndex) => {
      if (datumIndex === null) {
        return;
      }
      const vizDatumId = this.observedDatumIds[datumIndex];
      if (vizDatumId === undefined) {
        throw new Error("MapDataSet.writeDataMap: visualized datum id not found");
      }
      this.syncTextureData({
        datumId: vizDatumId,
        index: vizIndex as DatumVizIndex,
        topLeft: { col: 0, row: 0 },
        dims: this.worldDims,
      });
    });
  }

  private syncTextureData(args: {
    datumId: GenerationCellDatumId,
    index: DatumVizIndex,
    topLeft: CellCoord,
    dims: WorldDims,
  }): void {
    const { datumId, index, topLeft, dims } = args;

    // Convert the input integer data to float data
    // using the format rules to scale the value appropriately
    // to [0, 1).
    const range = this.getDataRangeForDatum(datumId);
    const mapData = this.getDataMap(datumId);
    this.textureSource.inject2D({
      topLeft,
      dims,
      index,
      src: mapData,
      range,
    });
  }

  private getDataRangeForDatum(datumId: GenerationCellDatumId): [number, number] {
    if ("RandGen" in datumId) {
      return [0, 0xffff];
    } else if ("Selector" in datumId) {
      throw new Error("MapDataSet.getDataRange: Selector not supported");
    } else {
      throw new Error("MapDataSet.getDataRange: unknown datum id");
    }
  }

  private ensureDataMap(datumId: GenerationCellDatumId): MapData<"uint32", 1> {
    const key = GenerationCellDatumId.toStringKey(datumId);
    let dataMap = this.dataMaps.get(key);
    if (dataMap) {
      throw new Error("MapDataSet.createDataMap: data map already exists");
    }
    dataMap = new MapData({
      dataType: "uint32",
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
}) => Promise<MapData<"uint32", 1>[]>;

export type ReadMiniMapDataCallback = (args: {
  miniDims: WorldDims,
  datumIds: GenerationCellDatumId[]
}) => Promise<MapData[]>;
