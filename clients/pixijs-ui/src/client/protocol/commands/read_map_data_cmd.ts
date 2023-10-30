import { CellCoord } from "../../../game/types/cell_coord";
import { WorldDims } from "../../../game/types/world_dims";

export type ReadMapDataKind = "Elevation" | "AnimalId";

export type ReadMapDataKindResultTypeMap = {
  Elevation: number;
  AnimalId: number;
};

export type ReadMapDataKindResultType<K extends ReadMapDataKind> =
  ReadMapDataKindResultTypeMap[K];

export type ReadMapDataCmd = {
  params: {
    top_left: CellCoord,
    area: WorldDims,
    kinds: ReadMapDataKind[],
  };
  response: {
    MapData: {
      elevations: ReadMapDataKindResultType<"Elevation">[][] | null,
      animal_ids: ReadMapDataKindResultType<"AnimalId">[][] | null,
    },
  };
};