import GameClientModule from "./module";
import SubcmdSender from "./subcmd_sender";
import CreateWorldSubcmd from "../protocol/commands/create_world_subcmd";
import { WorldDescriptorInput, WorldDescriptorValidation }
  from "../types/world_descriptor";
import { CellCoord, GenerationCellDatumId, GenerationStepKind, WorldDims } from "../lib";

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
    const response = await this.sendSubcmd("CurrentDescriptorInput", {});
    return response.CurrentDescriptorInput;
  }

  public async updateDescriptorInput(
    descriptor: WorldDescriptorInput
  ): Promise<true|WorldDescriptorValidation> {
    const response = await this.sendSubcmd("UpdateDescriptorInput", { descriptor });
    if ("Ok" in response) {
      return true;
    } else {
      return response.InvalidWorldDescriptor;
    }
  }

  public async takeGenerationStep(kind: GenerationStepKind): Promise<true> {
    const response = await this.sendSubcmd("TakeGenerationStep", { kind });
    if ("Ok" in response) {
      return true;
    }
    throw new Error(`Failed to take generation step: ${response.Failed.join(", ")}`);
  }

  public async beginGeneration(): Promise<true> {
    const response = await this.sendSubcmd("BeginGeneration", {});
    if ("Ok" in response) {
      return true;
    }
    throw new Error(`Failed to begin generation: ${response.Failed.join(", ")}`);
  }

  public async getMapData(args: {
    topLeft: CellCoord,
    dims: WorldDims,
    datumIds: GenerationCellDatumId[],
  }): Promise<Uint32Array[]> {
    const { topLeft, dims, datumIds } = args;
    const response = await this.sendSubcmd("GetMapData", args);
    const mapData = response.MapData;
    const result: Uint32Array[] = [];
    mapData.data.forEach(mapDatum => {
      const typedArray = new Uint32Array(mapDatum);
      result.push(typedArray);
    });
    return result;
  }

}
