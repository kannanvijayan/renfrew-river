import { CellCoord } from "../../types/cell_coord";
import { WorldDims } from "../../types/world_dims";

export type ReadMapDataKind = "Elevation" | "AnimalId";

export type ReadMapDataResultTypeMap = {
  Elevation: number;
  AnimalId: number;
};

export type ReadMapDataResultType<K extends ReadMapDataKind> =
  ReadMapDataResultTypeMap[K];

export type ReadMapDataCmd = {
  params: {
    topLeft: CellCoord,
    area: WorldDims,
    kinds: ReadMapDataKind[],
  };
  response: {
    MapData: {
      elevations: ReadMapDataResultType<"Elevation">[][] | null,
      animalIds: ReadMapDataResultType<"AnimalId">[][] | null,
    },
  };
};

export const ReadMapDataOutputNameMap = {
  Elevation: "elevations" as const,
  AnimalId: "animalIds" as const,
};

export type ReadMapDataKindsToOutput<Ks> =
  Ks extends [infer K, ...infer KsRest] ?
    ReadMapDataKindToOutputSinglet<K> & ReadMapDataKindsToOutput<KsRest> :
    Record<string, never>;

type ReadMapDataKindToOutputSinglet<K> =
  K extends ReadMapDataKind
    ? { [N in typeof ReadMapDataOutputNameMap[K]]: ReadMapDataResultType<K>[][] }
    : never;
