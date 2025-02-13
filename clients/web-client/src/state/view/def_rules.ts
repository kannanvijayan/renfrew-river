
export type DefRulesEntryCategory =
  | "terrain_gen/perlin_rules"
  | "terrain_gen/generator_program";

export type DefRulesEntrySelection =
  | DefRulesPerlinField
  | DefRulesGeneratorProgramSection;

export const DefRulesEntrySelection = {
  mapToId(entry: DefRulesEntrySelection): string {
    if (entry.startsWith("terrain_gen/perlin_rules")) {
      return DefRulesPerlinField.mapToId(
        entry as DefRulesPerlinField
      );
    } else if (entry.startsWith("terrain_gen/generator_program")) {
      return DefRulesGeneratorProgramSection.mapToId(
        entry as DefRulesGeneratorProgramSection
      );
    } else {
      throw new Error(`Invalid DefRulesEntrySelection: ${entry}`);
    }
  }
}

export type DefRulesPerlinField =
  | "terrain_gen/perlin_rules/seed"
  | "terrain_gen/perlin_rules/octaves"
  | "terrain_gen/perlin_rules/frequency"
  | "terrain_gen/perlin_rules/amplitude"
  | "terrain_gen/perlin_rules/outreg";

export const DefRulesPerlinField = {
  elementId: {
    seed: "DefineRulesetPerlinSeed",
    octaves: "DefineRulesetPerlinOctaves",
    frequency: "DefineRulesetPerlinFrequency",
    amplitude: "DefineRulesetPerlinAmplitude",
    outreg: "DefineRulesetPerlinOutReg",
  } as Record<string, string>,

  SEED: "terrain_gen/perlin_rules/seed" as const,
  OCTAVES: "terrain_gen/perlin_rules/octaves" as const,
  FREQUENCY: "terrain_gen/perlin_rules/frequency" as const,
  AMPLITUDE: "terrain_gen/perlin_rules/amplitude" as const,
  OUTREG: "terrain_gen/perlin_rules/outreg" as const,

  mapToId(entry: DefRulesPerlinField): string {
    const piece = entry.split("/").pop()!;
    return DefRulesPerlinField.elementId[piece];
  }
} as const;

export type DefRulesGeneratorProgramSection =
  | "terrain_gen/generator_program/format"
  | "terrain_gen/generator_program/init_program"
  | "terrain_gen/generator_program/iterations"
  | "terrain_gen/generator_program/pairwise_program"
  | "terrain_gen/generator_program/pairwise_outregs"
  | "terrain_gen/generator_program/merge_program"
  | "terrain_gen/generator_program/final_program";

export const DefRulesGeneratorProgramSection = {
  elementId: {
    format: "DefineRulesetGeneratorProgramFormat",
    init_program: "DefineRulesetGeneratorProgramInitProgram",
    iterations: "DefineRulesetGeneratorProgramIterations",
    pairwise_program: "DefineRulesetGeneratorProgramPairwiseProgram",
    pairwise_outregs: "DefineRulesetGeneratorProgramPairwiseOutRegs",
    merge_program: "DefineRulesetGeneratorProgramMergeProgram",
    final_program: "DefineRulesetGeneratorProgramFinalProgram",
  } as Record<string, string>,

  FORMAT: "terrain_gen/generator_program/format" as const,
  INIT_PROGRAM: "terrain_gen/generator_program/init_program" as const,
  ITERATIONS: "terrain_gen/generator_program/iterations" as const,
  PAIRWISE_PROGRAM: "terrain_gen/generator_program/pairwise_program" as const,
  PAIRWISE_OUTREGS: "terrain_gen/generator_program/pairwise_outregs" as const,
  MERGE_PROGRAM: "terrain_gen/generator_program/merge_program" as const,
  FINAL_PROGRAM: "terrain_gen/generator_program/final_program" as const,

  mapToId(section: DefRulesGeneratorProgramSection): string {
    const piece = section.split("/").pop()!;
    return DefRulesGeneratorProgramSection.elementId[piece];
  }
} as const;
