import { AnimalId } from "./animal_data";
import { Elevation } from "./elevation"

export type CellInfo = {
  elevation: Elevation;
  animalId: AnimalId | null;
}
