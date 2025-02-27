import { ShadyRegister, ShasmProgram, ShasmProgramValidation } from "../shady_vm";
import FormatRules, { FormatInput, FormatValidation } from "./format_rules";

type TerrainGenRules = {
  perlin: TerrainGenPerlinRules,
  stage: TerrainGenStageRules,
};
export default TerrainGenRules;

export type TerrainGenInput = {
  perlin: TerrainGenPerlinInput,
  stage: TerrainGenStageInput,
};
export type TerrainGenValidation = {
  errors: string[],
  perlin: TerrainGenPerlinValidation,
  stage: TerrainGenStageValidation,
};
export function defaultTerrainGenRules(): TerrainGenRules {
  return {
    perlin: defaultTerrainGenPerlinRules(),
    stage: defaultTerrainGenStageRules(),
  };
}

export type TerrainGenStageRules = {
  format: FormatRules,
  initProgram: ShasmProgram,
  iterations: number,
  pairwiseProgram: ShasmProgram,
  mergeProgram: ShasmProgram,
  finalProgram: ShasmProgram,
};
export type TerrainGenStageInput = {
  format: FormatInput,
  initProgram: string,
  iterations: string,
  pairwiseProgram: string,
  mergeProgram: string,
  finalProgram: string,
};
export type TerrainGenStageValidation = {
  errors: string[],

  format: FormatValidation,
  initProgram: ShasmProgramValidation,
  iterations: string[],
  pairwiseProgram: ShasmProgramValidation,
  mergeProgram: ShasmProgramValidation,
  finalProgram: ShasmProgramValidation,
};
function defaultTerrainGenStageRules(): TerrainGenStageRules {
  return {
    format: { wordFormats: [] },
    initProgram: { programText: "" },
    iterations: 1,
    pairwiseProgram: { programText: "" },
    mergeProgram: { programText: "" },
    finalProgram: { programText: "" },
  };
}

export type TerrainGenPerlinRules = {
  register: ShadyRegister,
};
export type TerrainGenPerlinInput = {
  register: string,
};
export type TerrainGenPerlinValidation = {
  errors: string[],
  register: string[],
};
function defaultTerrainGenPerlinRules(): TerrainGenPerlinRules {
  return { register: 0 };
}
