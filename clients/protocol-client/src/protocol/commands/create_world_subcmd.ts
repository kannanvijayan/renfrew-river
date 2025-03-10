import {
  CellCoord,
  GenerationCellDatumId,
  GenerationPhase,
  GenerationStepKind,
  WorldDescriptor,
  WorldDescriptorInput,
  WorldDescriptorValidation,
  WorldDims,
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
      Valid: WorldDescriptor,
      Invalid: WorldDescriptorValidation,
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
  GetMapData: {
    params: {
      topLeft: CellCoord,
      dims: WorldDims,
      datumIds: GenerationCellDatumId[],
    },
    response: {
      MapData: {
        topLeft: CellCoord,
        dims: WorldDims,
        data: number[][],
      }
    }
  }
}

export default CreateWorldSubcmd;
