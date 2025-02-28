import { RulesetInput, RulesetValidation } from "../../../lib";

type CurrentRulesCmd = {}

type CurrentRulesRsp = {
  ruleset: RulesetInput,
  validation: RulesetValidation | undefined,
}

export default CurrentRulesCmd;
export type { CurrentRulesRsp };
