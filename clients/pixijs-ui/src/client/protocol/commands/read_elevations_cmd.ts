import { CellCoord } from "../../../game/types/cell_coord";
import { WorldDims } from "../../../game/types/world_dims";

export type ReadElevationsCmd = {
  params: {
    top_left: CellCoord,
    area: WorldDims,
  };
  response: {
    Elevations: {
      elevations: number[][],
    };
  }
};