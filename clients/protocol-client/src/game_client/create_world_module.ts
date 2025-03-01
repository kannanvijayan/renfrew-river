import GameClientModule from "./module";
import SubcmdSender from "./subcmd_sender";
import CreateWorldSubcmd from "../protocol/commands/create_world/create_world_subcmd";
import WorldDescriptor from "../types/world_descriptor";

export class GameClientCreateWorldModule
  extends GameClientModule<CreateWorldSubcmd>
{
  public constructor(sender: SubcmdSender) {
    super(sender, "CreateWorld");
  }

  public async enter(): Promise<true> {
    return this.sender_.enterMode({ CreateWorld: {}});
  }

  public async leave(): Promise<true> {
    return this.sender_.enterMainMenuMode();
  }

  public async beginNewWorld(descriptor: WorldDescriptor): Promise<true> {
    const result = await this.sendSubcmd("BeginNewWorld", { descriptor });
    if ("Ok" in result) {
      return true;
    } else {
      throw new Error(result.Failed[0]);
    }
  }
}
