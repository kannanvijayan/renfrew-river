import { WorldDims } from "../../types/world_dims";

export type MiniElevationsCmd = {
  params: {
    mini_dims: WorldDims,
  };
  response: {
    MiniElevations: {
      elevations: number[][],
    };
  }
};
