import * as PIXI from 'pixi.js';
import GameMenuTitle from '../common/game_menu_title';
import MenuButton from '../common/menu_button';

export type UnconnectedMainMenuCallbackApi = {
  switchToEnterServerInfoView(): void;
}

export default class UnconnectedMainMenuView extends PIXI.Container {
  private readonly graphics: PIXI.Graphics;
  private readonly menuTitle: GameMenuTitle;
  private readonly connectButton: ConnectButton;

  constructor(opts: {
    callbackApi: UnconnectedMainMenuCallbackApi,
  }) {
    const { callbackApi } = opts;
    super();

    this.graphics = new PIXI.Graphics();

    this.menuTitle = new GameMenuTitle();
    this.menuTitle.x = 5;
    this.menuTitle.y = 5;

    this.connectButton = new ConnectButton({ callbackApi });
    this.connectButton.x = 50;
    this.connectButton.y = this.menuTitle.y + this.menuTitle.height + 25;

    this.graphics.addChild(this.menuTitle);
    this.graphics.addChild(this.connectButton);

    this.graphics.beginFill(0x404040);
    this.graphics.lineStyle(5, 0x202020);
    this.graphics.drawRoundedRect(
      0, 0, this.graphics.width + 10, this.graphics.height + 50, 10);
    this.graphics.endFill();
    this.addChild(this.graphics);
  }
}

class ConnectButton extends MenuButton {
  constructor(opts: { callbackApi: UnconnectedMainMenuCallbackApi }) {
    const { callbackApi } = opts;
    super({
      name: "UnconnectedMainMenu.Connect",
      text: "Connect",
      onClickListener: () => {
        callbackApi.switchToEnterServerInfoView();
      },
    });
  }
}
