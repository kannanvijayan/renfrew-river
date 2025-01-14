import { ShadyRegister, ShadyProgram } from "../shady_vm";
import { FormatRules } from "./format_rules";

export type TerrainGenStage = {
  perlin: TerrainGenPerlinRules,
  stage: TerrainGenStageRules,
};

export type TerrainGenStageRules = {
  format: FormatRules,
  init_program: ShadyProgram,
  iterations: number,
  pairwise_program: ShadyProgram,
  pairwise_output_registers: number,
  merge_program: ShadyProgram,
  final_program: ShadyProgram,
};

export type TerrainGenPerlinRules = {
  seed: string,
  octaves: number,
  frequency: number,
  amplitude: number,

  register: ShadyRegister,
};
