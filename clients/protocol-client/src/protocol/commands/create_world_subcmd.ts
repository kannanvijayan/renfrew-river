import {
  GenerationPhase,
  GenerationStepKind,
  WorldDescriptorInput,
  WorldDescriptorValidation,
} from "../../lib";

type CreateWorldSubcmd = {
  CurrentDescriptorInput: {
    params: {},
    response: {
      CurrentDescriptorInput: {
        descriptor: WorldDescriptorInput,
        validation: WorldDescriptorValidation,
      }
    },
  },
  UpdateDescriptorInput: {
    params: {
      descriptor: WorldDescriptorInput,
    },
    response: {
      Ok: {},
      InvalidWorldDescriptor: WorldDescriptorValidation,
    },
  },
  BeginGeneration: {
    params: {},
    response: {
      Ok: {},
      Failed: string[],
    },
  },
  TakeGenerationStep: {
    params: {
      kind: GenerationStepKind,
    },
    response: {
      Ok: {},
      Failed: string[],
    },
  },
  CurrentGenerationPhase: {
    params: {},
    response: {
      CurrentGenerationPhase: {
        phase: GenerationPhase,
      }
    },
  },
}

export default CreateWorldSubcmd;
