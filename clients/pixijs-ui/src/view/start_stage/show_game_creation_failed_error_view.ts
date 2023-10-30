import * as PIXI from 'pixi.js';
import GameMenuTitle from '../common/game_menu_title';
import MenuButton from '../common/menu_button';
import ErrorMessage from '../common/error_message';

export type ShowGameCreationFailedErrorCallbackApi = {
  switchToConnectedMainMenuView(): void;
}

export default class ShowGameCreationFailedErrorView extends PIXI.Container {
  private readonly graphics: PIXI.Graphics;

  private readonly menuTitle: GameMenuTitle;

  constructor(opts: {
    callbackApi: ShowGameCreationFailedErrorCallbackApi,
  }) {
    const { callbackApi } = opts;
    super();

    this.graphics = new PIXI.Graphics();

    this.menuTitle = new GameMenuTitle();
    this.menuTitle.x = 5;
    this.menuTitle.y = 5;

    const errorMsg = new ErrorMessage({ text: "Game Creation Failed" });
    errorMsg.x = this.menuTitle.width / 2 - errorMsg.width / 2;
    errorMsg.y = this.menuTitle.y + this.menuTitle.height + 25;

    const okButton = new OkButton({ callbackApi });
    okButton.x = 150;
    okButton.y = errorMsg.y + errorMsg.height + 25;

    this.graphics.addChild(this.menuTitle);
    this.graphics.addChild(errorMsg);
    this.graphics.addChild(okButton);

    this.graphics.beginFill(0x404040);
    this.graphics.lineStyle(5, 0x202020);
    this.graphics.drawRoundedRect(
      0, 0, this.graphics.width + 10, this.graphics.height + 50, 10);
    this.graphics.endFill();

    this.addChild(this.graphics);
  }
}

class OkButton extends MenuButton {
  constructor(opts: { callbackApi: ShowGameCreationFailedErrorCallbackApi }) {
    const { callbackApi } = opts;
    super({
      name: "ShowGameCreationFailedError.Ok",
      text: "Ok",
      width: 100,
      onClickListener: () => {
        callbackApi.switchToConnectedMainMenuView();
      },
    });
  }
}