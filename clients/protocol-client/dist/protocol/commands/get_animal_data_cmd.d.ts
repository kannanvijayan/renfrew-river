import { AnimalData, AnimalId } from "../../types/animal_data";
export type GetAnimalDataCmd = {
    params: {
        animal_id: AnimalId;
    };
    response: {
        AnimalData: AnimalData;
    };
};
