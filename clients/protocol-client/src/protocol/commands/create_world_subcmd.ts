import {
  CellCoord,
  GenerationCellDatumId,
  GenerationPhase,
  GenerationStepKind,
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
  GetMapData: {
    params: {
      top_left: CellCoord,
      dims: WorldDims,
      datum_ids: GenerationCellDatumId[],
    },
    response: {
      GetMapData: {
        top_left: CellCoord,
        dims: WorldDims,
        data: number[][],
      }
    }
  }
}

export default CreateWorldSubcmd;
