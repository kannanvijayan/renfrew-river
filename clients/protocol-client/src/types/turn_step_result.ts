import { TurnNo } from "./turn_no";

export type TurnStepResult = {
  turnNoAfter: TurnNo;
  elapsedMs: number;
};
