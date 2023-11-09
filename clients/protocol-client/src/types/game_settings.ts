import { WorldDims } from "./world_dims";

export type GameSettings = {
  worldDims: WorldDims,
  randSeed: number;
  extraFlags?: string;
};
