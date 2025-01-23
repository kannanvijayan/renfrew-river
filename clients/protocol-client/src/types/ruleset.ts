
import GameClient from "../game_client";
import {
  FormatRules,
  FormatRulesWord,
  FormatRulesComponent,
  addFormatRuleComponent,
} from "./ruleset/format_rules";

import {
  defaultTerrainGenRules,
  validateTerrainGenRules,
  TerrainGenPerlinRules,
  TerrainGenStageRules,
  TerrainGenRules,
} from "./ruleset/terrain_gen";

type Ruleset = {
  name: string,
  description: string,
  terrainGen: TerrainGenRules,
};
function defaultRuleset(): Ruleset {
  return {
    name: "",
    description: "",
    terrainGen: defaultTerrainGenRules(),
  };
}

async function validateRuleset(ruleset: Ruleset, client: GameClient): Promise<true | string[]> {
  const errors: string[] = [];

  // Ensure nonempty name and description
  if (ruleset.name === "") {
    errors.push("Ruleset name must not be empty");
  }

  if (ruleset.description === "") {
    errors.push("Ruleset description must not be empty");
  }

  validateTerrainGenRules(ruleset.terrainGen, errors);

  // validate program rules
  const stage = ruleset.terrainGen.stage;
  for (const [prog, progName] of [
    [stage.initProgram, "Init"],
    [stage.pairwiseProgram, "Pairwise"],
    [stage.mergeProgram, "Merge"],
    [stage.finalProgram, "Final"],
  ] as const) {
    const { programText } = prog;
    if (programText === "") {
      errors.push("Program text must not be empty");
    }

    // Check for syntax errors
    const result = await client.validateShasm(programText);
    if (result !== true) {
      errors.push(`Invalid ${progName} Program - ${result}`);
    }
  }

  return errors.length === 0 ? true : errors;
}

export default Ruleset;
export {
  FormatRules,
  FormatRulesWord,
  FormatRulesComponent,

  TerrainGenRules,
  TerrainGenStageRules,
  TerrainGenPerlinRules,

  addFormatRuleComponent,
  defaultRuleset,
  validateRuleset,
};
