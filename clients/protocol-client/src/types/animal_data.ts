import { CellCoord } from "./cell_coord";

export type AnimalId = number;
export const INVALID_ANIMAL_ID = 0xffffffff;

export type AnimalData = {
  position: CellCoord,
};
