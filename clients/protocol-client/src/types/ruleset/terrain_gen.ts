import { ShadyRegister, ShasmProgram, ShasmProgramValidation } from "../shady_vm";
import { FormatRules, FormatInput, FormatValidation } from "./format_rules";

export type TerrainGenRules = {
  perlin: TerrainGenPerlinRules,
  stage: TerrainGenStageRules,
};
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
export function validateTerrainGenRules(
  rules: TerrainGenRules,
  errors: string[]
): boolean {
  // Validate perlin rules
  validateInteger(rules.perlin.octaves, 1, 9, "Perlin octaves", errors);
  validateInteger(rules.perlin.frequency, 1, 99, "Perlin frequency", errors);
  validateInteger(rules.perlin.amplitude, 1, 99, "Perlin amplitude", errors);

  // Validate stage rules
  validateInteger(rules.stage.iterations, 1, 9999, "Stage iterations", errors);

  // Validate format rules
  validateInteger(rules.stage.format.wordFormats.length, 1, 63,
    "Stage format word count", errors);

  return errors.length === 0;
}

function validateInteger(
  value: number,
  min: number,
  max: number,
  name: string,
  errors: string[]
): void {
  if (!Number.isInteger(value)) {
    errors.push(`${name} must be an integer`);
  }
  if (value < min) {
    errors.push(`${name} must be at least ${min}`);
  }
  if (value > max) {
    errors.push(`${name} must be at most ${max}`);
  }
}

export type TerrainGenStageRules = {
  format: FormatRules,
  initProgram: ShasmProgram,
  iterations: number,
  pairwiseProgram: ShasmProgram,
  pairwiseOutputRegisters: number,
  mergeProgram: ShasmProgram,
  finalProgram: ShasmProgram,
};
export type TerrainGenStageInput = {
  format: FormatInput,
  initProgram: string,
  iterations: string,
  pairwiseProgram: string,
  pairwiseOutputRegisters: string,
  mergeProgram: string,
  finalProgram: string,
};
export type TerrainGenStageValidation = {
  errors: string[],

  format: FormatValidation,
  initProgram: ShasmProgramValidation,
  iterations: string[],
  pairwiseProgram: ShasmProgramValidation,
  pairwiseOutputRegisters: string[],
  mergeProgram: ShasmProgramValidation,
  finalProgram: ShasmProgramValidation,
};
function defaultTerrainGenStageRules(): TerrainGenStageRules {
  return {
    format: { wordFormats: [] },
    initProgram: { programText: "" },
    iterations: 1,
    pairwiseProgram: { programText: "" },
    pairwiseOutputRegisters: 0,
    mergeProgram: { programText: "" },
    finalProgram: { programText: "" },
  };
}

export type TerrainGenPerlinRules = {
  seed: number,
  octaves: number,
  frequency: number,
  amplitude: number,

  register: ShadyRegister,
};
export type TerrainGenPerlinInput = {
  seed: string,
  octaves: string,
  frequency: string,
  amplitude: string,

  register: string,
};
export type TerrainGenPerlinValidation = {
  errors: string[],

  seed: string[],
  octaves: string[],
  frequency: string[],
  amplitude: string[],

  register: string[],
};
function defaultTerrainGenPerlinRules(): TerrainGenPerlinRules {
  return {
    seed: 1,
    octaves: 1,
    frequency: 1,
    amplitude: 1,
    register: 0,
  };
}
