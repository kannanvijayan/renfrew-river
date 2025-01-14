
import {
  FormatRules,
  FormatRulesWord,
  FormatRulesComponent,
} from "./ruleset/format_rules";

import {
  TerrainGenPerlinRules,
} from "./ruleset/terrain_gen";

type Ruleset = {
  terrain_gen: TerrainGenPerlinRules,
};

export default Ruleset;
export {
  FormatRules,
  FormatRulesWord,
  FormatRulesComponent,

  TerrainGenPerlinRules,
};
