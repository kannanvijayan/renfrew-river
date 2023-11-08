import { GameSettings } from "renfrew-river-protocol-client";
import UnconnectedMainMenuView from './unconnected_main_menu_view';
import TopViewAttributes from '../top_view_attributes';
import StageView from '../common/stage_view';
import EnterServerInfoView from './enter_server_info_view';
import ShowConnectionFailedErrorView from './show_connection_failed_error_view';
import ConnectedMainMenuView from './connected_main_menu_view';
import SpecifyGameSettingsView from './specify_game_settings_view';
import ShowGameCreationFailedErrorView from './show_game_creation_failed_error_view';
import GameLoadingView from './game_loading_view';
import { ProgressCallback } from '../../util/progress_tracking';

export interface StartStageCallbackApi {
  connectToServer(server: string): Promise<GameSettings>;
  disconnectFromServer(): void;
  currentGameSettings(): GameSettings;
  validateGameSettings(settings: GameSettings, errors: string[]): boolean;
  setCurrentGameSettings(settings: GameSettings): void;
  hasGame(): Promise<GameSettings | false>;
  createNewGame(): Promise<void>;
  setLoadGameProgressCallback(callback: ProgressCallback): void;
  loadGame(): Promise<void>;

  switchFromStartToPlayStage(): void;
}

enum StartSubstage {
  UnconnectedMainMenu,
  EnterServerInfo,
  ShowConnectionFailedError,
  ConnectedMainMenu,
  SpecifyGameSettings,
  ShowGameCreationFailedError,
  GameLoading,
}

/**
 * The start stage of the game.
 */
export default class StartStageView extends StageView {
  private callbackApi: StartStageCallbackApi;
  private substage: StartSubstage;

  private unconnectedMainMenuView: UnconnectedMainMenuView | null;
  private enterServerInfoView: EnterServerInfoView | null;
  private showConnectionFailedErrorView: ShowConnectionFailedErrorView | null;
  private connectedMainMenuView: ConnectedMainMenuView | null;
  private specifyGameSettingsView: SpecifyGameSettingsView | null;
  private showGameCreationFailedErrorView: ShowGameCreationFailedErrorView | null;
  private gameLoadingView: GameLoadingView | null;

  constructor(opts: {
    topViewAttributes: TopViewAttributes,
    callbackApi: StartStageCallbackApi,
  }) {
    const { callbackApi, topViewAttributes } = opts;
    super({ topViewAttributes });
    this.callbackApi = callbackApi;
    this.substage = StartSubstage.UnconnectedMainMenu;
    this.unconnectedMainMenuView = null;
    this.enterServerInfoView = null;
    this.showConnectionFailedErrorView = null;
    this.connectedMainMenuView = null;
    this.specifyGameSettingsView = null;
    this.showGameCreationFailedErrorView = null;
    this.gameLoadingView = null;

    this.initUnconnectedMainMenuView();
  }

  public shutdown() {
    this.destroyUnconnectedMainMenuView();
    this.destroyEnterServerInfoView();
    this.destroyShowConnectionFailedErrorView();
    this.destroyShowConnectionFailedErrorView();
    this.destroyConnectedMainMenuView();
    this.destroySpecifyGameSettingsView();
    this.destroyShowGameCreationFailedErrorView();
    this.destroyGameLoadingView();
    super.shutdown();
  }

  protected preResize(_width: number, _height: number): void {
    switch (this.substage) {
      case StartSubstage.UnconnectedMainMenu:
        this.destroyUnconnectedMainMenuView();
        break;
      case StartSubstage.EnterServerInfo:
        this.destroyEnterServerInfoView();
        break;
      case StartSubstage.ShowConnectionFailedError:
        this.destroyShowConnectionFailedErrorView();
        break;
      case StartSubstage.ConnectedMainMenu:
        this.destroyConnectedMainMenuView();
        break;
      case StartSubstage.SpecifyGameSettings:
        this.destroySpecifyGameSettingsView();
        break;
      case StartSubstage.ShowGameCreationFailedError:
        this.destroyShowGameCreationFailedErrorView();
        break;
      case StartSubstage.GameLoading:
        this.destroyGameLoadingView();
        break;
    }
  }
  protected postResize(_width: number, _height: number): void {
    switch (this.substage) {
      case StartSubstage.UnconnectedMainMenu:
        this.initUnconnectedMainMenuView();
        break;
      case StartSubstage.EnterServerInfo:
        this.initEnterServerInfoView();
        break;
      case StartSubstage.ShowConnectionFailedError:
        this.initShowConnectionFailedErrorView();
        break;
      case StartSubstage.ConnectedMainMenu:
        this.initConnectedMainMenuView();
        break;
      case StartSubstage.SpecifyGameSettings:
        this.initSpecifyGameSettingsView();
        break;
      case StartSubstage.ShowGameCreationFailedError:
        this.initShowGameCreationFailedErrorView();
        break;
      case StartSubstage.GameLoading:
        this.initGameLoadingView();
        break;
    }
  }

  private initUnconnectedMainMenuView(): void {
    this.unconnectedMainMenuView = new UnconnectedMainMenuView({
      callbackApi: {
        switchToEnterServerInfoView: () => {
          this.destroyUnconnectedMainMenuView();
          this.substage = StartSubstage.EnterServerInfo;
          this.initEnterServerInfoView();
        }
      }
    });
    this.unconnectedMainMenuView.x =
      this.topViewAttributes.areaWidth / 2 - this.unconnectedMainMenuView.width / 2;
    this.unconnectedMainMenuView.y =
      this.topViewAttributes.areaHeight / 2 - this.unconnectedMainMenuView.height / 2;
    this.addChild(this.unconnectedMainMenuView);
  }
  private destroyUnconnectedMainMenuView(): void {
    if (this.unconnectedMainMenuView !== null) {
      this.removeChild(this.unconnectedMainMenuView);
      this.unconnectedMainMenuView = null;
    }
  }

  private initEnterServerInfoView(): void {
    this.enterServerInfoView = new EnterServerInfoView({
      callbackApi: {
        connectToServer: this.callbackApi.connectToServer,
        setCurrentGameSettings: this.callbackApi.setCurrentGameSettings,
        hasGame: this.callbackApi.hasGame,

        switchToShowConnectionFailedErrorView: () => {
          this.destroyEnterServerInfoView();
          this.substage = StartSubstage.ShowConnectionFailedError;
          this.initShowConnectionFailedErrorView();
        },
        switchToConnectedMainMenuView: () => {
          this.destroyEnterServerInfoView();
          this.substage = StartSubstage.ConnectedMainMenu;
          this.initConnectedMainMenuView();
        },
        switchToUnconnectedMainMenuView: () => {
          this.destroyEnterServerInfoView();
          this.substage = StartSubstage.UnconnectedMainMenu;
          this.initUnconnectedMainMenuView();
        },

        startLoadingAndSwitchToLoadingView: () => {
          this.destroyEnterServerInfoView();
          this.substage = StartSubstage.GameLoading;
          this.initGameLoadingView();
          this.startLoading();
        },
      }
    });

    this.enterServerInfoView.x =
      this.topViewAttributes.areaWidth / 2 - this.enterServerInfoView.width / 2;
    this.enterServerInfoView.y =
      this.topViewAttributes.areaHeight / 2 - this.enterServerInfoView.height / 2;
    this.addChild(this.enterServerInfoView);
  }

  private destroyEnterServerInfoView(): void {
    if (this.enterServerInfoView !== null) {
      this.removeChild(this.enterServerInfoView);
      this.enterServerInfoView = null;
    }
  }

  private initShowConnectionFailedErrorView(): void {
    this.showConnectionFailedErrorView = new ShowConnectionFailedErrorView({
      callbackApi: {
        switchToUnconnectedMainMenuView: () => {
          this.destroyShowConnectionFailedErrorView();
          this.substage = StartSubstage.UnconnectedMainMenu;
          this.initUnconnectedMainMenuView();
        },
      }
    });

    this.showConnectionFailedErrorView.x =
      this.topViewAttributes.areaWidth / 2 - this.showConnectionFailedErrorView.width / 2;
    this.showConnectionFailedErrorView.y =
      this.topViewAttributes.areaHeight / 2 - this.showConnectionFailedErrorView.height / 2;
    this.addChild(this.showConnectionFailedErrorView);
  }

  private destroyShowConnectionFailedErrorView(): void {
    if (this.showConnectionFailedErrorView !== null) {
      this.removeChild(this.showConnectionFailedErrorView);
      this.showConnectionFailedErrorView = null;
    }
  }

  private initConnectedMainMenuView(): void {
    this.connectedMainMenuView = new ConnectedMainMenuView({
      callbackApi: {
        createNewGame: this.callbackApi.createNewGame,
        disconnectFromServer: this.callbackApi.disconnectFromServer,

        switchToSpecifyGameSettingsView: () => {
          this.destroyConnectedMainMenuView();
          this.substage = StartSubstage.SpecifyGameSettings;
          this.initSpecifyGameSettingsView();
        },
        switchToUncconnectedMainMenuView: () => {
          this.destroyConnectedMainMenuView();
          this.substage = StartSubstage.UnconnectedMainMenu;
          this.initUnconnectedMainMenuView();
        },
        switchToGameCreationFailedErrorView: () => {
          this.destroyConnectedMainMenuView();
          this.substage = StartSubstage.ShowGameCreationFailedError;
          this.initShowGameCreationFailedErrorView();
        },

        startLoadingAndSwitchToLoadingView: () => {
          this.destroyConnectedMainMenuView();
          this.substage = StartSubstage.GameLoading;
          this.initGameLoadingView();
          this.startLoading();
        }
      }
    });

    this.connectedMainMenuView.x =
      this.topViewAttributes.areaWidth / 2 - this.connectedMainMenuView.width / 2;
    this.connectedMainMenuView.y =
      this.topViewAttributes.areaHeight / 2 - this.connectedMainMenuView.height / 2;
    this.addChild(this.connectedMainMenuView);
  }

  private destroyConnectedMainMenuView(): void {
    if (this.connectedMainMenuView !== null) {
      this.removeChild(this.connectedMainMenuView);
      this.connectedMainMenuView = null;
    }
  }

  private initSpecifyGameSettingsView(): void {
    const currentGameSettings = this.callbackApi.currentGameSettings();
    this.specifyGameSettingsView = new SpecifyGameSettingsView({
      callbackApi: {
        validateGameSettings: this.callbackApi.validateGameSettings,
        switchToConnectedMainMenuView: (mbSettings) => {
          if (mbSettings) {
            this.callbackApi.setCurrentGameSettings(mbSettings);
          }
          this.destroySpecifyGameSettingsView();
          this.substage = StartSubstage.ConnectedMainMenu;
          this.initConnectedMainMenuView();
        },
      },
      currentGameSettings,
    });

    this.specifyGameSettingsView.x =
      this.topViewAttributes.areaWidth / 2 - this.specifyGameSettingsView.width / 2;
    this.specifyGameSettingsView.y =
      this.topViewAttributes.areaHeight / 2 - this.specifyGameSettingsView.height / 2;
    this.addChild(this.specifyGameSettingsView);
  }

  private destroySpecifyGameSettingsView(): void {
    if (this.specifyGameSettingsView !== null) {
      this.removeChild(this.specifyGameSettingsView);
      this.specifyGameSettingsView = null;
    }
  }

  private initShowGameCreationFailedErrorView(): void {
    this.showGameCreationFailedErrorView = new ShowGameCreationFailedErrorView({
      callbackApi: {
        switchToConnectedMainMenuView: () => {
          this.destroyShowGameCreationFailedErrorView();
          this.substage = StartSubstage.ConnectedMainMenu;
          this.initConnectedMainMenuView();
        },
      }
    });

    this.showGameCreationFailedErrorView.x =
      this.topViewAttributes.areaWidth / 2 - this.showGameCreationFailedErrorView.width / 2;
    this.showGameCreationFailedErrorView.y =
      this.topViewAttributes.areaHeight / 2 - this.showGameCreationFailedErrorView.height / 2;
    this.addChild(this.showGameCreationFailedErrorView);
  }

  private destroyShowGameCreationFailedErrorView(): void {
    if (this.showGameCreationFailedErrorView !== null) {
      this.removeChild(this.showGameCreationFailedErrorView);
      this.showGameCreationFailedErrorView = null;
    }
  }

  private initGameLoadingView(): void {
    this.gameLoadingView = new GameLoadingView();

    this.gameLoadingView.x =
      this.topViewAttributes.areaWidth / 2 - this.gameLoadingView.width / 2;
    this.gameLoadingView.y =
      this.topViewAttributes.areaHeight / 2 - this.gameLoadingView.height / 2;
    this.addChild(this.gameLoadingView);

    this.callbackApi.setLoadGameProgressCallback((progress) => {
      this.gameLoadingView!.setProgress(
        progress.current / progress.total,
        `${progress.label}`
      );
    });
  }

  private destroyGameLoadingView(): void {
    if (this.gameLoadingView !== null) {
      this.removeChild(this.gameLoadingView);
      this.gameLoadingView = null;
    }
  }

  private async startLoading(): Promise<void> {
    await this.callbackApi.loadGame();
    this.callbackApi.switchFromStartToPlayStage();
  }
}
