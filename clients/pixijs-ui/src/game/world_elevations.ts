import { CellCoord } from "./types/cell_coord";
import { Constants } from "../client/protocol/types/constants";
import { WorldDims } from "./types/world_dims";

/**
 * Convenience class to store elevations in a uint8 array.
 */
export default class GameWorldElevations {
  public readonly constants: Constants;
  public readonly worldDims: WorldDims;
  public readonly values: Uint8Array;

  constructor(opts: {
    constants: Constants,
    worldDims: WorldDims,
  }) {
    this.constants = opts.constants;
    this.worldDims = opts.worldDims;
    this.values = new Uint8Array(this.worldDims.rows * this.worldDims.columns);
  }

  public valueAt(x: number, y: number): number {
    return this.values[y * this.worldDims.columns + x];
  }

  public writeElevations(opts: {
    topLeft: CellCoord,
    area: WorldDims,
    elevations: number[][],
  }): void {
    // When writing elevations, we want to keep only the top 8 bits.
    // To know how many bits to shift, we need to know how many bits
    // are in the elevation values.
    const { elevation_bits } = this.constants;
    const shift_bits = elevation_bits - 8;

    const { topLeft, area, elevations } = opts;
    for (let j = 0; j < area.rows; j++) {
      let incomingRow = elevations[j];
      let yj = (topLeft.row + j) * this.worldDims.columns;
      for (let i = 0; i < area.columns; i++) {
        this.values[yj + topLeft.col + i] = incomingRow[i] >> shift_bits;
      }
    }
  }
}