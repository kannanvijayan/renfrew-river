import { TurnNo } from "../../types/turn_no";
import { EmptyObject } from "../../util/empty_object";
export type TakeTurnStepCmd = {
    params: EmptyObject;
    response: {
        TurnTaken: {
            turnNoAfter: TurnNo;
            elapsedMs: number;
        };
    };
};
