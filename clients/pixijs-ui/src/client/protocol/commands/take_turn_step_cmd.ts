import { TurnNo } from "../../../game/types/turn_no";
import { EmptyObject } from "../../../util/empty_object";

export type TakeTurnStepCmd = {
  params: EmptyObject;
  response: {
    TurnTaken: {
      turn_no_after: TurnNo;
      elapsed_ms: number;
    };
  };
};
