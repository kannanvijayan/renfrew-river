import { Ruleset } from "renfrew-river-protocol-client";
import GameServerSession from "../server_session";

/**
 * Proxies a running instance of a game on a server.
 */
export default class DefRulesGameMode {
  public readonly serverSession: GameServerSession;

  private partial_ruleset_: Partial<Ruleset>;

  public constructor(serverSession: GameServerSession) {
    this.serverSession = serverSession;
    this.partial_ruleset_ = {};
  }
}
