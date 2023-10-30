import { AnimalData } from "../../../game/types/animal_data";

export type ReadAnimalsCmd = {
  params: {};
  response: {
    Animals: {
      animals: AnimalData[],
    };
  }
};