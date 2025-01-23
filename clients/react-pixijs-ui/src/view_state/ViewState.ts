import GameClient from "renfrew-river-protocol-client";
import GameServerSession from "../game/server_session";
import GameInstance from "../game/instance";
import DefRulesGameMode from "../game/mode/def_rules";

import { atom } from 'jotai';
import DefRulesViewState, {
  defRulesViewStateAtom,
} from "./DefRulesViewState";

const gameClientAtom = atom<GameClient | null>(null);
const gameServerSessionAtom = atom<GameServerSession | null>(null);
const gameInstanceAtom = atom<GameInstance | DefRulesGameMode | null>(null);
const viewStateModeAtom = atom<ViewStateMode>({ Unconnected: null });

export type ViewStateMode =
  | { Unconnected: null }
  | { Connected: { session: GameServerSession } }
  | { Game: { instance: GameInstance } }
  | { DefRules: { instance: DefRulesGameMode } };

export type ViewState = {
  client: GameClient | null,
  serverSession: GameServerSession | null,
  mode: ViewStateMode,
  defRulesViewState: DefRulesViewState;
}

const viewStateAtom = atom<ViewState>(get => {
  return {
    client: get(gameClientAtom),
    serverSession: get(gameServerSessionAtom),
    instance: get(gameInstanceAtom),
    mode: get(viewStateModeAtom),
    defRulesViewState: get(defRulesViewStateAtom),
  };
});

export {
  viewStateAtom,
  viewStateModeAtom,
  gameServerSessionAtom,
  gameInstanceAtom,
}
