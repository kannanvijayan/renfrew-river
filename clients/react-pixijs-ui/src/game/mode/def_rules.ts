import { Ruleset } from "renfrew-river-protocol-client";
import GameServerSession from "../server_session";

/**
 * Proxies a running instance of a game on a server.
 */
export default class DefRulesGameMode {
  public readonly serverSession: GameServerSession;

  private ruleset: Ruleset | null;

  public constructor(serverSession: GameServerSession) {
    this.serverSession = serverSession;
    this.ruleset = null;
  }
}
