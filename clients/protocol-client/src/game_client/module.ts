import {
  ProtocolSubcmdName,
  ProtocolSubcmdParams,
  ProtocolSubcmdResponse,
  ProtocolSubcmdSpec,
} from "../protocol/subcommand";
import SubcmdSender from "./subcmd_sender";

export default class GameClientModule<S extends ProtocolSubcmdSpec> {
  protected readonly sender_: SubcmdSender;
  private readonly category_: string;

  public constructor(sender: SubcmdSender, category: string) {
    this.sender_ = sender;
    this.category_ = category;
  }

  protected async sendSubcmd<T extends ProtocolSubcmdName<S>>(
    subcmd: T,
    params: ProtocolSubcmdParams<S, T>,
  ): Promise<ProtocolSubcmdResponse<S, T>> {
    return this.sender_.send(this.category_, subcmd, params);
  }
}
