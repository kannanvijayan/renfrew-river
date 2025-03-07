import {
  CellCoord,
  GenerationCellDatumId,
  WorldDims,
} from "renfrew-river-protocol-client";

export type MapDataArrayType =
  | "uint8" | "uint16" | "uint32"
  | "int8" | "int16" | "int32";

const MapDataArrayClass = {
  uint8: Uint8Array,
  uint16: Uint16Array,
  uint32: Uint32Array,
  int8: Int8Array,
  int16: Int16Array,
  int32: Int32Array,
} as const;

type TypedArray =
  | Uint8Array | Uint16Array | Uint32Array
  | Int8Array | Int16Array | Int32Array;

/**
 * Unspecialized abstarct base class for map data.
 */
export class MapDataBase {
  public readonly dataType: MapDataArrayType;
  public readonly dims: WorldDims;
  public readonly array: TypedArray;

  constructor(dataType: MapDataArrayType, dims: WorldDims) {
    this.dataType = dataType;
    this.dims = dims;
    const arrayType = MapDataArrayClass[dataType];
    this.array = new arrayType(this.dims.rows * this.dims.columns);
  }

  public valueAt(x: number, y: number): number {
    return this.array[y * this.dims.columns + x];
  }

  public write2D(opts: {
    topLeft: CellCoord,
    dims: WorldDims,
    data: MapDataBase,
  }): void {
    const { topLeft, dims, data } = opts;
    for (let j = 0; j < dims.rows; j++) {
      const dstj = (topLeft.row + j) * this.dims.columns;
      const srcj = j * dims.columns;
      for (let i = 0; i < dims.columns; i++) {
        this.array[dstj + topLeft.col + i] = data.array[srcj + i];
      }
    }
  }
}

/**
 * Convenience class to store various data mapped by coordinates.
 */
export default class MapData<T extends MapDataArrayType = MapDataArrayType>
  extends MapDataBase
{
  constructor(dataType: T, dims: WorldDims) {
    super(dataType, dims);
  }
}

export class MapDataSet {
  private readonly worldDims: WorldDims;
  private readonly dataMaps: Map<string, MapData>;
  private readonly observedDatumIds: GenerationCellDatumId[];

  public constructor(worldDims: WorldDims) {
    this.worldDims = worldDims;
    this.observedDatumIds = [];
    this.dataMaps = new Map();
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

  public getDataMap(datumId: GenerationCellDatumId): MapData {
    const datumKey = GenerationCellDatumId.toStringKey(datumId);
    const dataMap = this.dataMaps.get(datumKey);
    if (!dataMap) {
      throw new Error("MapDataSet.getDataMap: data map not found");
    }
    return dataMap;
  }

  private ensureDataMap(datumId: GenerationCellDatumId): MapData {
    const key = GenerationCellDatumId.toStringKey(datumId);
    let dataMap = this.dataMaps.get(key);
    if (dataMap) {
      throw new Error("MapDataSet.createDataMap: data map already exists");
    }
    dataMap = new MapData("int32", this.worldDims);
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
