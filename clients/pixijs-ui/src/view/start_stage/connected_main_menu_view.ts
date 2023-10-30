import * as PIXI from 'pixi.js';
import GameMenuTitle from '../common/game_menu_title';
import MenuButton from '../common/menu_button';
import GameMenuSubtitle from '../common/game_menu_subtitle';

export type ConnectedMainMenuCallbackApi = {
  createNewGame(): Promise<void>;
  disconnectFromServer(): void;

  switchToSpecifyGameSettingsView(): void;
  switchToUncconnectedMainMenuView(): void;
  switchToGameCreationFailedErrorView(): void;

  startLoadingAndSwitchToLoadingView(): void;
}

export default class ConnectedMainMenuView extends PIXI.Container {
  private readonly graphics: PIXI.Graphics;
  private readonly menuTitle: GameMenuTitle;
  private readonly menuSubtitle: GameMenuSubtitle;
  private readonly settingsButton: SettingsButton;
  private readonly createGameButton: CreateGameButton;
  private readonly disconnectButton: DisconnectButton;

  constructor(opts: {
    callbackApi: ConnectedMainMenuCallbackApi,
  }) {
    const { callbackApi } = opts;
    super();

    this.graphics = new PIXI.Graphics();

    this.menuTitle = new GameMenuTitle();
    this.menuTitle.x = 5;
    this.menuTitle.y = 5;

    this.menuSubtitle = new GameMenuSubtitle({
      text: "A simulation game",
    });
    this.menuSubtitle.x = 5;
    this.menuSubtitle.y = this.menuTitle.y + this.menuTitle.height + 3;

    this.settingsButton = new SettingsButton({ callbackApi });
    this.settingsButton.x = 50;
    this.settingsButton.y =
      this.menuSubtitle.y + this.menuSubtitle.height + 25;

    this.createGameButton = new CreateGameButton({ callbackApi });
    this.createGameButton.x = 50;
    this.createGameButton.y =
      this.settingsButton.y + this.settingsButton.height + 25;

    this.disconnectButton = new DisconnectButton({ callbackApi });
    this.disconnectButton.x = 50;
    this.disconnectButton.y =
      this.createGameButton.y + this.createGameButton.height + 25;

    this.graphics.addChild(this.menuTitle);
    this.graphics.addChild(this.menuSubtitle);
    this.graphics.addChild(this.settingsButton);
    this.graphics.addChild(this.createGameButton);
    this.graphics.addChild(this.disconnectButton);

    this.graphics.beginFill(0x404040);
    this.graphics.lineStyle(5, 0x202020);
    this.graphics.drawRoundedRect(
      0, 0, this.graphics.width + 10, this.graphics.height + 50, 10);
    this.graphics.endFill();
    this.addChild(this.graphics);
  }
}

class SettingsButton extends MenuButton {
  constructor(opts: { callbackApi: ConnectedMainMenuCallbackApi }) {
    const { callbackApi } = opts;
    super({
      name: "ConnectedMainMenu.Settings",
      text: "New Game Settings",
      onClickListener: () => {
        callbackApi.switchToSpecifyGameSettingsView();
      },
    });
  }
}

class CreateGameButton extends MenuButton {
  constructor(opts: { callbackApi: ConnectedMainMenuCallbackApi }) {
    const { callbackApi } = opts;
    super({
      name: "ConnectedMainMenu.CreateGame",
      text: "Create New Game",
      onClickListener: async () => {
        // Try creating a new game.
        try {
          await callbackApi.createNewGame();
        } catch (err) {
          // Creation failed, so switch to the error view.
          console.error("Failed to create new game", err);
          callbackApi.switchToGameCreationFailedErrorView();
          return;
        }

        // Creation succeeded, start loading the game.
        callbackApi.startLoadingAndSwitchToLoadingView();
      },
    });
  }
}

class DisconnectButton extends MenuButton {
  constructor(opts: { callbackApi: ConnectedMainMenuCallbackApi }) {
    const { callbackApi } = opts;
    super({
      name: "ConnectedMainMenu.Disconnect",
      text: "Disconnect",
      color: 0x804040,
      onClickListener: () => {
        callbackApi.disconnectFromServer();
        callbackApi.switchToUncconnectedMainMenuView();
      },
    });
  }
}