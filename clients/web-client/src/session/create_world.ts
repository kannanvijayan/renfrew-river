import GameClient, { WorldDescriptorInput, WorldDescriptorValidation } from "renfrew-river-protocol-client";

import { BumpTimeout } from "../util/bump_timeout";
import ConnectedViewState, { ConnectedViewMode } from "../state/view/connected_view";
import CreateWorldViewState from "../state/view/create_world/create_world";
import { store } from "../store/root";
import { dispatchApp } from "../store/dispatch";

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
    dispatchApp.view.connected.createWorld(
      CreateWorldViewState.action.setDescriptor(descriptor)
    );
    dispatchApp.view.connected.createWorld(
      CreateWorldViewState.action.setValidation(validation)
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

  public async updateDescriptorInput(input: WorldDescriptorInput)
    : Promise<true | WorldDescriptorValidation>
  {
    return this.client.createWorld.updateDescriptorInput(input);
  }

  public async beginGeneration(): Promise<true> {
    await this.client.createWorld.beginGeneration();
    dispatchApp.view.connected(ConnectedViewState.action.setCreateWorld({
      GeneratingWorld: null,
    }));
    return true;
  }

  public async leave(): Promise<true> {
    await this.client.createWorld.leave();
    dispatchApp.view.connected.createWorld(
      CreateWorldViewState.action.setValidation(null)
    );
    dispatchApp.view.connected.createWorld(
      CreateWorldViewState.action.setDescriptor(null)
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
    const validation = result === true ? null : result;
    console.log("CreateWorldViewController.syncSendWorldDescriptorInput", {
      validation
    });
    dispatchApp.view.connected.createWorld(
      CreateWorldViewState.action.setValidation(validation)
    );
  }
}
