import { WorldDims } from "../../types/world_dims";

export type MiniElevationsCmd = {
  params: {
    miniDims: WorldDims,
  };
  response: {
    MiniElevations: {
      elevations: number[][],
    };
  }
};
