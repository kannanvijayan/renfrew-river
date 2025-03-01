import WorldDims, { WorldDimsInput } from "./world_dims"

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

export default WorldDescriptor;
export type { WorldDescriptorInput };
