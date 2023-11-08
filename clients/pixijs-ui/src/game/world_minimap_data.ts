import { GameConstants, WorldDims } from "renfrew-river-protocol-client";
import MapData from "./map_data";

/**
 * Holder of mini-map data.
 */
export default class WorldMinimapData {
  public readonly constants: GameConstants;
  public readonly miniDims: WorldDims;
  public readonly elevations: MapData<"uint8">;

  constructor(opts: {
    constants: GameConstants,
    miniDims: WorldDims,
  }) {
    this.constants = opts.constants;
    this.miniDims = opts.miniDims;
    this.elevations = new MapData("uint8", this.miniDims);
  }

  public writeElevations(elevations: number[][]) {
    // When writing elevations, we want to keep only the top 8 bits.
    // To know how many bits to shift, we need to know how many bits
    // are in the elevation values.
    const { elevation_bits } = this.constants;
    const shift_bits = elevation_bits - 8;

    this.elevations.write2D({
      topLeft: { col: 0, row: 0 },
      area: this.miniDims,
      genValue: (x, y) => (elevations[y][x] >> shift_bits)
    });
  }
}
