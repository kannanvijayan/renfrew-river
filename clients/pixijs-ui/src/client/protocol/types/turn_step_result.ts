import { TurnNo } from "../../../game/types/turn_no";

export type TurnStepResult = {
  turn_no_after: TurnNo;
  elapsed_ms: number;
};
