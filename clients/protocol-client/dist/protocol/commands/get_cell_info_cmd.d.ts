import { CellCoord } from "../../types/cell_coord";
import { CellInfo } from "../../types/cell_info";
export type GetCellInfoCmd = {
    params: {
        cell_coord: CellCoord;
    };
    response: {
        CellInfo: CellInfo;
    };
};
