import * as PIXI from 'pixi.js';
import * as PIXI_UI from '@pixi/ui';
import GameMenuTitle from '../common/game_menu_title';
import GameMenuSubtitle from '../common/game_menu_subtitle';
import MenuButton from '../common/menu_button';
import { GameSettings } from "renfrew-river-protocol-client";

export type EnterServerInfoCallbackApi = {
  connectToServer(addr: string): Promise<GameSettings>;
  setCurrentGameSettings(settings: GameSettings): void;
  hasGame(): Promise<GameSettings | false>;

  switchToShowConnectionFailedErrorView(): void;
  switchToConnectedMainMenuView(): void;
  switchToUnconnectedMainMenuView(): void;

  startLoadingAndSwitchToLoadingView(): void;
}

type EnterServerInfoData = {
  addr: string;
};

export default class EnterServerInfoView extends PIXI.Container {
  private readonly data: EnterServerInfoData;
  private readonly graphics: PIXI.Graphics;

  private readonly menuTitle: GameMenuTitle;
  private readonly menuSubtitle: GameMenuSubtitle
  private readonly input: ServerInfoInput;
  private readonly okButton: OkButton;
  private readonly cancelButton: CancelButton;

  constructor(opts: {
    callbackApi: EnterServerInfoCallbackApi,
  }) {
    const { callbackApi } = opts;
    super();

    this.data = {
      addr: "",
    };
    this.graphics = new PIXI.Graphics();

    this.menuTitle = new GameMenuTitle();
    this.menuTitle.x = 5;
    this.menuTitle.y = 5;

    this.menuSubtitle = new GameMenuSubtitle({ text: "Connect to Server" });
    this.menuSubtitle.x = 5;
    this.menuSubtitle.y = this.menuTitle.y + this.menuTitle.height + 3;

    this.input = new ServerInfoInput({ data: this.data });
    this.input.x = 50;
    this.input.y = this.menuSubtitle.y + this.menuSubtitle.height + 25;

    this.okButton = new OkButton({
      callbackApi,
      data: this.data,
    });
    this.okButton.x = 50;
    this.okButton.y = this.input.y + this.input.height + 25;
    
    this.cancelButton = new CancelButton({
      callbackApi
    });
    this.cancelButton.x = 50 + this.okButton.width + 100;
    this.cancelButton.y = this.input.y + this.input.height + 25;

    this.graphics.addChild(this.menuTitle);
    this.graphics.addChild(this.menuSubtitle);
    this.graphics.addChild(this.input);
    this.graphics.addChild(this.okButton);
    this.graphics.addChild(this.cancelButton);

    this.graphics.beginFill(0x404040);
    this.graphics.lineStyle(5, 0x202020);
    this.graphics.drawRoundedRect(
      0, 0, this.graphics.width + 10, this.graphics.height + 50, 10);
    this.graphics.endFill();
    this.addChild(this.graphics);
  }
}

class ServerInfoInput extends PIXI_UI.Input {
  constructor(opts: { data: EnterServerInfoData }) {
    const { data } = opts;
    const bg = new PIXI.Graphics();
    bg.beginFill(0x808040);
    bg.lineStyle(0);
    bg.drawRect(0, 0, 300, 60);
    bg.endFill();
    super({
      bg,
      padding: 10,
      placeholder: "ws://...",
    });

    this.onChange.connect((text) => {
      data.addr = text;
    });
  }
}

class OkButton extends MenuButton {
  constructor(opts: {
    callbackApi: EnterServerInfoCallbackApi,
    data: EnterServerInfoData,
  }) {
    const { callbackApi, data } = opts;
    super({
      name: "EnterServerInfo.Ok",
      text: "Ok",
      width: 100,
      onClickListener: async () => {
        try {
          await callbackApi.connectToServer(data.addr);
        } catch (err) {
          console.error("Failed to connect to server", data.addr, err);
          callbackApi.switchToShowConnectionFailedErrorView();
          return;
        }

        // Check if the server has a game already.
        // If it doesn't, switch to the connection view.
        const hasGame = await callbackApi.hasGame();
        if (!hasGame) {
          callbackApi.switchToConnectedMainMenuView();
          return;
        }

        // Otherwise, switch to loading view.
        callbackApi.startLoadingAndSwitchToLoadingView();
      },
    });
  }
}

class CancelButton extends MenuButton {
  constructor(opts: { callbackApi: EnterServerInfoCallbackApi }) {
    const { callbackApi } = opts;
    super({
      name: "EnterServerInfo.Cancel",
      text: "Cancel",
      width: 100,
      color: 0x804040,
      onClickListener: () => {
        callbackApi.switchToUnconnectedMainMenuView();
      },
    });
  }
}
