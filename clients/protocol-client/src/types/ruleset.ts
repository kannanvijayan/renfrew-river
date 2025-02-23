
import GameClient from "../game_client";
import {
  FormatRules,
  FormatInput,
  FormatValidation,
  FormatWordRules,
  FormatWordInput,
  FormatWordValidation,
  FormatComponentRules,
  FormatComponentInput,
  FormatComponentValidation,
  addFormatRuleComponent,
} from "./ruleset/format_rules";

import {
  defaultTerrainGenRules,
  validateTerrainGenRules,
  TerrainGenPerlinRules,
  TerrainGenStageRules,
  TerrainGenRules,
  TerrainGenInput,
  TerrainGenValidation,
} from "./ruleset/terrain_gen";

export type Ruleset = {
  name: string,
  description: string,
  terrainGen: TerrainGenRules,
};
export type RulesetInput = {
  name: string,
  description: string,
  terrainGen: TerrainGenInput,
};
export type RulesetValidation = {
  errors: string[],
  name: string[],
  description: string[],
  terrainGen: TerrainGenValidation,
}
export function defaultRuleset(): Ruleset {
  return {
    name: "",
    description: "",
    terrainGen: defaultTerrainGenRules(),
  };
}

export default Ruleset;
export {
  FormatRules,
  FormatInput,
  FormatValidation,
  FormatWordRules,
  FormatWordInput,
  FormatWordValidation,
  FormatComponentRules,
  FormatComponentInput,
  FormatComponentValidation,

  TerrainGenRules,
  TerrainGenStageRules,
  TerrainGenPerlinRules,
  TerrainGenValidation,

  addFormatRuleComponent,
};
