import { GenerationCellDatumId, WorldDescriptor } from "renfrew-river-protocol-client";
import WorldMapTiledData from "./map/world_map_tiled_data";
import WorldMinimapData from "./map/world_minimap_data";
import Session from "../session/session";
import MapData from "./map/map_data";

/**
 * Holds all the simulation domain data.
 */
export default class Simulation {
  public readonly descriptor: WorldDescriptor;
  public readonly mapData: WorldMapTiledData;
  public readonly minimapData: WorldMinimapData;

  public constructor(args: {
    descriptor: WorldDescriptor,
    session: Session,
  }) {
    const { descriptor, session } = args;
    this.descriptor = descriptor;
    const worldDims = descriptor.dims;
    this.mapData = new WorldMapTiledData({
      worldDims,
      readMapData: async (args) => {
        const responseData = await session.createWorld.getMapData(args);
        return responseData.map(data => new MapData({
          dataType: "uint32",
          size: 1,
          dims: args.dims,
          array: new Uint32Array(data),
        }));
      },
    });
    this.minimapData = new WorldMinimapData({
      readMiniMapDataCallback: async (args) => {
        const minimapData = await session.createWorld.getMinimapData(args);
        return new MapData({
          dataType: "uint32",
          size: 1,
          dims: args.miniDims,
          array: minimapData,
        });
      },
    });
  }

  public setObservedDatumIds(datumIds: GenerationCellDatumId[]): void {
    this.mapData.setObservedDatumIds(datumIds);
    this.minimapData.setObservedDatumIds(datumIds);
  }

  public setVisualizedDatumId(index: number, datumIndex: number): void {
    this.mapData.setVisualizedDatumId(index, datumIndex);
    this.minimapData.setVisualizedDatumId(datumIndex);
  }

  public invalidateMapData(): void {
    this.mapData.invalidate();
    this.minimapData.invalidate();
  }
}
