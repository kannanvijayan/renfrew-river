import WorldDims, { WorldDimsInput, WorldDimsValidation } from "./world_dims"

type WorldDescriptor = {
  name: string,
  description: string,
  seed: string,
  dims: WorldDims,
  rulesetName: string,
};

type WorldDescriptorInput = {
  name: string,
  description: string,
  seed: string,
  dims: WorldDimsInput,
  rulesetName: string,
};

type WorldDescriptorValidation = {
  errors: string[],
  name: string[],
  description: string[],
  seed: string[],
  dims: WorldDimsValidation,
  rulesetName: string[],
};

const WorldDescriptorValidation = {
  isValid(validation: WorldDescriptorValidation): boolean {
    return validation.errors.length === 0 &&
      validation.name.length === 0 &&
      validation.description.length === 0 &&
      validation.seed.length === 0 &&
      WorldDimsValidation.isValid(validation.dims) &&
      validation.rulesetName.length === 0;
  }
};

export default WorldDescriptor;
export { WorldDescriptorInput, WorldDescriptorValidation };
