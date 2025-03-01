import Ruleset, { RulesetInput, RulesetValidation } from "../../types/ruleset/ruleset";

type DefineRulesSubcmd = {
  UpdateRules: {
    params: { rulesetInput: RulesetInput },
    response: {
      Ok: {},
      InvalidRuleset: RulesetValidation
    },
  },
  CurrentRules: {
    params: {},
    response: {
      CurrentRules: {
        ruleset: RulesetInput,
        validation: RulesetValidation | undefined,
      },
    },
  },
  SaveRules: {
    params: {},
    response: {
      Ok: {},
      Failed: string[],
    },
  },
  LoadRules: {
    params: { rulesetName: string },
    response: {
      LoadedRuleset: Ruleset,
      Failed: string[],
    },
  },
}

export default DefineRulesSubcmd;
