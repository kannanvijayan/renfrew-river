import { AnimalData, AnimalId } from "../../types/animal_data";

export type GetAnimalDataCmd = {
  params: {
    animalId: AnimalId;
  };
  response: {
    AnimalData: AnimalData;
  };
};
