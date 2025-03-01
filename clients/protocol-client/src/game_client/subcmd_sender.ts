
import { GameModeInfo } from "../lib";
import {
  ProtocolSubcmdName,
  ProtocolSubcmdParams,
  ProtocolSubcmdResponse,
  ProtocolSubcmdSpec,
} from "../protocol/subcommand";

export default interface SubcmdSender {
  send<
    S extends ProtocolSubcmdSpec,
    T extends ProtocolSubcmdName<S>
  >(
    category: string,
    subcmd: T,
    params: ProtocolSubcmdParams<S, T>,
  ): Promise<ProtocolSubcmdResponse<S, T>>;

  enterMode(mode: GameModeInfo): Promise<true>;
  enterMainMenuMode(): Promise<true>;
}
