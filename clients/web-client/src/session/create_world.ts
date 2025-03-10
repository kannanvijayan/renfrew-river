import GameClient, {
  CellCoord,
  GenerationCellDatumId,
  WorldDescriptor,
  WorldDescriptorInput,
  WorldDims,
} from "renfrew-river-protocol-client";

import { BumpTimeout } from "../util/bump_timeout";
import ConnectedViewState, { ConnectedViewMode } from "../state/view/connected_view";
import CreateWorldViewState from "../state/view/create_world/create_world";
import { store } from "../store/root";
import { dispatchApp } from "../store/dispatch";
import SpecifyDescriptorViewState from "../state/view/create_world/specify_descriptor";

export class CreateWorldModule {
  private readonly client: GameClient;
  public readonly view: CreateWorldViewController;

  constructor(client: GameClient) {
    this.client = client;
    this.view = new CreateWorldViewController(this.client);
  }

  public async postConnectInit() {
    const { descriptor, validation } =
      await this.client.createWorld.currentDescriptorInput();
    dispatchApp.view.connected(ConnectedViewState.action.setCreateWorld(
      CreateWorldViewState.initialState
    ));
    dispatchApp.view.connected.createWorld.specifyDescriptor(
      SpecifyDescriptorViewState.action.setDescriptor(descriptor)
    );
    dispatchApp.view.connected.createWorld.specifyDescriptor(
      SpecifyDescriptorViewState.action.setValidation(validation)
    );
    dispatchApp.view.connected(
      ConnectedViewState.action.setViewMode(ConnectedViewMode.CREATE_WORLD)
    );
  }

  public async enter(): Promise<true> {
    await this.client.createWorld.enter();
    return true;
  }

  public async currentDescriptorInput(): Promise<WorldDescriptorInput> {
    const current = await this.client.createWorld.currentDescriptorInput();
    return current.descriptor;
  }

  public async beginGeneration(descriptor: WorldDescriptor): Promise<true> {
    await this.client.createWorld.beginGeneration();
    dispatchApp.view.connected(ConnectedViewState.action.setCreateWorld({
      GeneratingWorld: { descriptor }
    }));
    return true;
  }

  public async getMapData(args: {
    topLeft: CellCoord,
    dims: WorldDims,
    datumIds: GenerationCellDatumId[],
  }): Promise<Uint32Array[]> {
    return this.client.createWorld.getMapData(args);
  }

  public async leave(): Promise<true> {
    await this.client.createWorld.leave();
    dispatchApp.view.connected.createWorld.specifyDescriptor(
      SpecifyDescriptorViewState.action.setValidation(null)
    );
    dispatchApp.view.connected.createWorld.specifyDescriptor(
      SpecifyDescriptorViewState.action.setDescriptor(null)
    );
    dispatchApp.view.connected(
      ConnectedViewState.action.setViewMode(ConnectedViewMode.MAIN_MENU)
    );
    return true;
  }
}

export class CreateWorldViewController {
  private static readonly DEFAULT_BUMP_INTERVAL = 50;
  private readonly client_: GameClient;
  private validationTimeout_: BumpTimeout | null;

  constructor(client: GameClient) {
    this.client_ = client;
    this.validationTimeout_ = null;
  }

  public bumpValidationTimeout(interval?: number) {
    let timeout = this.validationTimeout_;
    interval = interval ?? CreateWorldViewController.DEFAULT_BUMP_INTERVAL;
    if (timeout) {
      timeout.bump(interval);
    } else {
      timeout = new BumpTimeout(interval, () => this.syncSendWorldDescriptorInput());
      this.validationTimeout_ = timeout;
    }
  }

  private async syncSendWorldDescriptorInput() {
    this.validationTimeout_ = null;

    console.log("CreateWorldViewController.syncSendWorldDescriptorInput");
    const state = store.getState();
    const createWorldViewState = state.view.connected.createWorld;
    if (
      !createWorldViewState ||
      !("SpecifyDescriptor" in createWorldViewState) ||
      !createWorldViewState.SpecifyDescriptor.descriptor
    ) {
      return;
    }
    const input = createWorldViewState.SpecifyDescriptor.descriptor;
    const result = await this.client_.createWorld.updateDescriptorInput(input);
    console.log("CreateWorldViewController.syncSendWorldDescriptorInput", {
      result
    });

    if ("Valid" in result) {
      dispatchApp.view.connected.createWorld.specifyDescriptor(
        SpecifyDescriptorViewState.action.setValidatedDescriptor(result.Valid)
      );
    } else {
      dispatchApp.view.connected.createWorld.specifyDescriptor(
        SpecifyDescriptorViewState.action.setValidation(result.Invalid)
      );
    }
  }
}
