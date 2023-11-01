import { AnimalData } from "../../../game/types/animal_data";
import { EmptyObject } from "../../../util/empty_object";

export type ReadAnimalsCmd = {
  params: EmptyObject;
  response: {
    Animals: {
      animals: AnimalData[],
    };
  }
};