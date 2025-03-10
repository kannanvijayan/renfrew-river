import { WorldDescriptor } from "renfrew-river-protocol-client";
import WorldMapTiledData from "./map/world_map_tiled_data";
import Session from "../session/session";
import MapData from "./map/map_data";

/**
 * Holds all the simulation domain data.
 */
export default class Simulation {
  public readonly descriptor: WorldDescriptor;
  public readonly mapData: WorldMapTiledData;

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
          dims: worldDims,
          array: new Uint32Array(data),
        }));
      },
    });
  }
}
