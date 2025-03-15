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
  }): void {
    const { srcTopLeft, dstTopLeft, copyDims, src, srcVizIndex, dstVizIndex } = opts;
    const dstArray = this.array;
    const srcArray = src.array;
    this.write2DWith({
      srcTopLeft,
      dstTopLeft,
      srcDims: src.dims,
      copyDims,
      srcSize: src.size,
      callback: (dstIdx, srcIdx) => {
        dstArray[dstIdx + dstVizIndex] = srcArray[srcIdx + srcVizIndex];
      }
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

  public getMapData(datumId: GenerationCellDatumId): MapData<"uint32", 1> {
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

  private notifyTextureUpdateListeners(): void {
    for (const listener of this.textureUpdateListeners) {
      try {
        listener();
      } catch (error) {
        console.error("MapDataSet.notifyTextureUpdateListeners: error in listener", {
          error,
          stack: new Error().stack?.split("\n"),
          listener,
        });
      }
    }
  }

  public updateMapData(args: {
    datumId: GenerationCellDatumId,
    dstTopLeft: CellCoord,
    src: MapData<"uint32", 1>,
  }): void {
    const { datumId, dstTopLeft, src } = args;
    const syncDims = src.dims;

    // Write it to the datum-id specific map.
    const dataMap = this.getMapData(datumId);
    dataMap.write2D({
      srcTopLeft: { col: 0, row: 0 },
      dstTopLeft,
      copyDims: syncDims,
      src,
      srcVizIndex: 0,
      dstVizIndex: 0,
    });

    // Write any visualized datum id values to the texture map.
    const vizIndexes: DatumVizIndex[] = [];
    this.visualizedDatumIndexes.forEach((datumIndex, vizIndex) => {
      if (datumIndex === null) {
        return;
      }
      const vizDatumId = this.observedDatumIds[datumIndex];
      if (vizDatumId === undefined) {
        throw new Error("MapDataSet.writeDataMap: visualized datum id not found");
      }
      if (GenerationCellDatumId.equal(datumId, vizDatumId)) {
        vizIndexes.push(vizIndex as DatumVizIndex);
      }
    });
    this.syncTextureDataMulti({
      vizIndexes,
      topLeft: dstTopLeft,
      dims: syncDims,
    });
  }

  public reinjectTextureData(): void {
    const vizIndexes: DatumVizIndex[] = [];
    this.visualizedDatumIndexes.forEach((datumIndex, vizIndex) => {
      if (datumIndex === null) {
        return;
      }
      const vizDatumId = this.observedDatumIds[datumIndex];
      if (vizDatumId === undefined) {
        throw new Error("MapDataSet.writeDataMap: visualized datum id not found");
      }
      vizIndexes.push(vizIndex as DatumVizIndex);
    });
    this.syncTextureDataMulti({
      vizIndexes,
      topLeft: { col: 0, row: 0 },
      dims: this.worldDims,
    });
  }

  private syncTextureDataMulti(args: {
    vizIndexes: DatumVizIndex[],
    topLeft: CellCoord,
    dims: WorldDims,
  }): void {
    const { vizIndexes, topLeft, dims } = args;

    for (const vizIndex of vizIndexes) {
      this.syncTextureData({ vizIndex, topLeft, dims });
    }
    if (vizIndexes.length > 0) {
      this.notifyTextureUpdateListeners();
    }
  }

  private syncTextureData(args: {
    vizIndex: DatumVizIndex,
    topLeft: CellCoord,
    dims: WorldDims,
  }): void {
    const { vizIndex, topLeft, dims } = args;
    console.log("MapDataSet.syncTextureData BEGIN", args);

    const obsIndex = this.visualizedDatumIndexes[vizIndex];
    if (obsIndex === null) {
      console.error("MapDataSet.syncTextureData: datumId is null", {
        vizIndex,
      });
      return;
    }
    const datumId = this.observedDatumIds[obsIndex];
    if (datumId === undefined) {
      console.error("MapDataSet.syncTextureData: datumId not found", {
        obsIndex,
        vizIndex,
      });
      return;
    }

    // Convert the input integer data to float data
    // using the format rules to scale the value appropriately
    // to [0, 1).
    const range = this.getDataRange(datumId);
    const mapData = this.getMapData(datumId);
    this.textureSource.inject2D({
      srcTopLeft: topLeft,
      dstTopLeft: topLeft,
      copyDims: dims,
      dstVizIndex: vizIndex,
      srcVizIndex: 0,
      src: mapData,
      range,
    });
  }

  private getDataRange(datumId: GenerationCellDatumId): [number, number] {
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
    dataMap.array.fill(0xffff);
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
