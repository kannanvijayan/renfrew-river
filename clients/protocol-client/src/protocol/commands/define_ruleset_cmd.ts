import Ruleset from "../../types/ruleset";
import { EmptyObject } from "../../util/empty_object";

export type DefineRulesetCmd = {
  params: {
    name: string,
    description: string,
    ruleset: Ruleset,
  },
  response: {
    Ok: EmptyObject,
  },
};
