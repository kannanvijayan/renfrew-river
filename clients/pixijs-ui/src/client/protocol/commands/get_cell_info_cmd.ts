import { CellCoord } from "../../../game/types/cell_coord";
import { CellInfo } from "../../../game/types/cell_info";

export type GetCellInfoCmd = {
  params: {
    cell_coord: CellCoord,
  };
  response: {
    CellInfo: CellInfo;
  };
};
