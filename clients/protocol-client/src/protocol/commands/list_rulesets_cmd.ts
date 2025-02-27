import { RulesetEntry } from "../../types/ruleset/ruleset";

type ListRulesetsCmd = {
  params: {},
  response: {
    RulesetList: RulesetEntry[],
  }
};

export default ListRulesetsCmd;
