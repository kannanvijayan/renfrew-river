import { GameSnapshot } from "../../types/game_snapshot";
import { EmptyObject } from "../../util/empty_object";

export type SnapshotGameCmd = {
  params: EmptyObject;
  response: {
    GameSnapshot: GameSnapshot;
  };
};
