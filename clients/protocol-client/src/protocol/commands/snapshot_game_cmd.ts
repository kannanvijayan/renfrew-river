import { CellCoord } from "../../types/cell_coord";
import { CellInfo } from "../../types/cell_info";

export type SnapshotGameCmd = {
  params: Record<string, never>;
  response: {
    GameSnapshot: string;
  };
};
