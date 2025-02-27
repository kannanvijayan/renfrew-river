
import FormatRules, {
  FormatInput,
  FormatValidation,
  FormatWordRules,
  FormatWordInput,
  FormatWordValidation,
  FormatComponentRules,
  FormatComponentInput,
  FormatComponentValidation,
  addFormatRuleComponent,
} from "./format_rules";

import TerrainGenRules, {
  defaultTerrainGenRules,
  TerrainGenPerlinRules,
  TerrainGenStageRules,
  TerrainGenInput,
  TerrainGenValidation,
} from "./terrain_gen_rules";

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
