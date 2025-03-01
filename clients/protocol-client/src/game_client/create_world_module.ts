import GameClientModule from "./module";
import SubcmdSender from "./subcmd_sender";
import CreateWorldSubcmd from "../protocol/commands/create_world_subcmd";
import WorldDescriptor, { WorldDescriptorInput, WorldDescriptorValidation } from "../types/world_descriptor";

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

  public async currentDescriptorInput(): Promise<{
    descriptor: WorldDescriptorInput,
    validation: WorldDescriptorValidation,
  }> {
    const result = await this.sendSubcmd("CurrentDescriptorInput", {});
    return result.CurrentDescriptorInput;
  }

  public async updateDescriptorInput(
    descriptor: WorldDescriptorInput
  ): Promise<true|WorldDescriptorValidation> {
    const result = await this.sendSubcmd("UpdateDescriptorInput", { descriptor });
    if ("Ok" in result) {
      return true;
    } else {
      return result.InvalidWorldDescriptor;
    }
  }

  public async beginGeneration(): Promise<true> {
    const result = await this.sendSubcmd("BeginGeneration", {});
    if ("Ok" in result) {
      return true;
    }
    throw new Error(`Failed to begin generation: ${result.Failed.join(", ")}`);
  }
}
