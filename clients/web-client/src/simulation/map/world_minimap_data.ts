import { WorldDims } from "renfrew-river-protocol-client";
import { MapDataSet, ReadMiniMapDataCallback } from "./map_data";

/**
 * Holder of mini-map data.
 */
export default class WorldMinimapData {
  public readonly readMiniMapDataCallback: ReadMiniMapDataCallback;
  public readonly miniDims: WorldDims;
  private readonly mapDataSet: MapDataSet;

  private constructor(opts: {
    readMiniMapDataCallback: ReadMiniMapDataCallback,
    miniDims: WorldDims,
  }) {
    this.readMiniMapDataCallback = opts.readMiniMapDataCallback;
    this.miniDims = opts.miniDims;
    this.mapDataSet = new MapDataSet(this.miniDims);
  }

  public static async load(opts: {
    readMiniMapDataCallback: ReadMiniMapDataCallback,
    miniDims: WorldDims,
  }): Promise<WorldMinimapData> {
    const { readMiniMapDataCallback, miniDims } = opts;
    const result = new WorldMinimapData({ readMiniMapDataCallback, miniDims });
    const datumIds = [ ...result.mapDataSet.getObservedDatumIds() ];
    const miniDataMaps = await readMiniMapDataCallback({ miniDims, datumIds });
    for (const [i, miniDataMap] of miniDataMaps.entries()) {
      result.mapDataSet.getDataMap(datumIds[i]).write2D({
        topLeft: { col: 0, row: 0 },
        dims: miniDims,
        data: miniDataMap,
      })
    }
    return result;
  }
}
