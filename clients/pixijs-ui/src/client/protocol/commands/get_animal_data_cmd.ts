import { AnimalData, AnimalId } from "../../../game/types/animal_data";

export type GetAnimalDataCmd = {
  params: {
    animal_id: AnimalId;
  };
  response: {
    AnimalData: AnimalData;
  };
};
