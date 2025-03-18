import { GenerationCellDatumId, WorldDims } from "renfrew-river-protocol-client";
import MapData, { ReadMiniMapDataCallback } from "./map_data";

export default class MinimapDataset {
  private readonly miniDims: WorldDims;
  private readonly observedDatumIds: GenerationCellDatumId[];
  private visualizedDatumIndex: number | null;
  private readonly readMiniMapDataCallback: ReadMiniMapDataCallback;

  // For minimaps, the updated type arrays and the texture source
  // arrays are the same.
  private readonly dataMaps: Map<string, MapData<"uint32", 1>>;

  // A single f32x4 typed array that is used as a texture input
  // for the shader.
  private readonly textureSource: MapData<"float32", 1>;

  // To handle texture updates.
  private readonly refreshListeners: (() => void)[];

  public constructor(args: {
    miniDims: WorldDims,
    readMiniMapDataCallback: ReadMiniMapDataCallback,
  }) {
    const { miniDims, readMiniMapDataCallback } = args;
    this.miniDims = miniDims;
    this.readMiniMapDataCallback = readMiniMapDataCallback;
    this.observedDatumIds = [];
    this.dataMaps = new Map();
    this.textureSource = new MapData({
      dataType: "float32",
      size: 1,
      dims: miniDims,
    });
    this.visualizedDatumIndex = null;
    this.refreshListeners = [];
  }

  public getObservedDatumIds(): GenerationCellDatumId[] {
    return [...this.observedDatumIds];
  }

  public setObservedDatumIds(datumIds: GenerationCellDatumId[]): void {
    this.observedDatumIds.splice(0, this.observedDatumIds.length, ...datumIds);
    this.invalidate();
  }

  public setVisualizedDatumId(datumIndex: number): void {
    if (this.visualizedDatumIndex === datumIndex) {
      return;
    }
    if (datumIndex < 0 || datumIndex >= this.observedDatumIds.length) {
      throw new Error("MinimapDataSet.setVisualizedDatumId: index out of range");
    }

    // Overwrite the texture source with the map data for the visualized datum.
    const datumId = this.observedDatumIds[datumIndex];
    this.visualizedDatumIndex = datumIndex;
    this.syncVisualizedDatumId(datumId);
  }

  public getTextureSource(): MapData<"float32", 1> {
    return this.textureSource;
  }

  private syncVisualizedDatumId(datumId: GenerationCellDatumId): void {
    console.log("MinimapDataSet.syncVisualizedDatumId", { datumId });
    const dataMap = this.tryGetMapData(datumId);
    if (!dataMap) {
      // Data map is not ready yet.  This method will get called again
      // when it becomes ready.
      return;
    }
    const range = this.getDataRange(datumId);

    console.log("MinimapDataSet.syncVisualizedDatumId - Synchronizing", {
      datumId,
      range,
      data: dataMap.array
    });
    this.textureSource.write2D({
      srcTopLeft: { row: 0, col: 0 },
      dstTopLeft: { row: 0, col: 0 },
      copyDims: this.miniDims,
      srcVizIndex: 0,
      dstVizIndex: 0,
      src: dataMap,
      transform: (value) => {
        let clamped = value;
        if (value < range[0]) {
          clamped = range[0];
        } else if (value > range[1]) {
          clamped = range[1];
        }
        return (clamped - range[0]) / (range[1] - range[0]);
      }
    })

    // Syncing needs to cause a texture update.
    this.notifyRefreshListeners();
  }

  public async invalidate(): Promise<void> {
    console.log("MinimapDataSet.invalidate", {
      minimap: [ ...this.dataMaps.entries() ],
      vizDatumIndex: this.visualizedDatumIndex,
    });
    this.dataMaps.clear();
    for (const datumid of this.observedDatumIds) {
      await this.ensureData(datumid);
    }
    if (this.visualizedDatumIndex !== null) {
      const datumId = this.observedDatumIds[this.visualizedDatumIndex];
      this.syncVisualizedDatumId(datumId);
    }
  }

  public tryGetMapData(datumId: GenerationCellDatumId)
    : MapData<"uint32", 1> | undefined
  {
    const datumKey = GenerationCellDatumId.toStringKey(datumId);
    return this.dataMaps.get(datumKey);
  }

  public getMinimapData(datumId: GenerationCellDatumId): MapData<"uint32", 1> {
    const datumKey = GenerationCellDatumId.toStringKey(datumId);
    const dataMap = this.dataMaps.get(datumKey);
    if (!dataMap) {
      throw new Error("MinimapDataSet.getMapData: map data not found");
    }
    return dataMap;
  }

  public addRefreshListener(listener: () => void): () => void {
    this.refreshListeners.push(listener);
    return () => this.removeRefreshListener(listener);
  }

  private removeRefreshListener(listener: () => void): void {
    const index = this.refreshListeners.indexOf(listener);
    if (index < 0) {
      console.error("WorldElevationsTiled.removeTextureUpdateListener: listener not found");
      return;
    }
    this.refreshListeners.splice(index, 1);
  }

  private notifyRefreshListeners(): void {
    for (const listener of this.refreshListeners) {
      try {
        listener();
      } catch (error) {
        console.error("MinimapDataSet.notifyTextureUpdateListeners: error in listener", {
          error,
          stack: new Error().stack?.split("\n"),
          listener,
        });
      }
    }
  }

  private getDataRange(datumId: GenerationCellDatumId): [number, number] {
    if ("RandGen" in datumId) {
      return [0, 0x10000];
    } else if ("Selector" in datumId) {
      throw new Error("MinimapDataSet.getDataRange: Selector not supported");
    } else {
      throw new Error("MinimapDataSet.getDataRange: unknown datum id");
    }
  }

  private async ensureData(datumId: GenerationCellDatumId):
    Promise<MapData<"uint32", 1>>
  {
    const key = GenerationCellDatumId.toStringKey(datumId);
    let dataMap = this.dataMaps.get(key);
    if (dataMap) {
      return dataMap;
    }
    // Read the data from the server.
    dataMap = await this.readMiniMapDataCallback({ miniDims: this.miniDims, datumId });
    this.dataMaps.set(key, dataMap);
    return dataMap;
  }
}
