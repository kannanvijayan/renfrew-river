
import * as PIXI from 'pixi.js';
import TopViewAttributes from './top_view_attributes';
import StartStageView from './start_stage/start_stage_view';
import PlayStageView from './play_stage/play_stage_view';
import { GameSettings } from '../client/protocol/types/settings';
import { ProgressCallback } from '../util/progress_tracking';
import WorldObserver from '../game/world_observer';

export interface TopViewCallbackApi {
  startStage: {
    connectToServer(server: string): Promise<GameSettings>;
    disconnectFromServer(): void;
    hasGame(): Promise<GameSettings | false>;
    createNewGame(): Promise<void>;

    currentGameSettings(): GameSettings;
    validateGameSettings(settings: GameSettings, errors: string[]): boolean;
    setCurrentGameSettings(settings: GameSettings): void;

    setLoadGameProgressCallback(callback: ProgressCallback): void;
    loadGame(): Promise<void>;
  };
  playStage: {
    newWorldObserver(): WorldObserver;
    ensureMapDataLoaded: (
      topleft: { col: number, row: number },
      area: { columns: number, rows: number }
    ) => Promise<{
      tilesUpdated: number,
      tilesInvalidated: number,
      surroundingsLoaded: Promise<{
        tilesUpdated: number,
        tilesInvalidated: number,
      }>
    }>,
    takeTurnStep: () => Promise<void>,
  };
}

export enum TopViewStage {
  Start = "Start",
  Play = "Play",
}

export default class TopView {
  private readonly callbackApi: TopViewCallbackApi;
  public readonly pixiApp: PIXI.Application;
  public readonly attributes: TopViewAttributes;

  private stage: TopViewStage;
  private startStageView: StartStageView | null;
  private playStageView: PlayStageView | null;

  private absTime: number;
  private tickCallbacks: ((delta: number, absTime: number) => void)[];

  constructor(opts: { callbackApi: TopViewCallbackApi }) {
    const { callbackApi } = opts;

    this.callbackApi = callbackApi;
    this.pixiApp = new PIXI.Application({
      backgroundColor: 0x000000,
      resolution: window.devicePixelRatio || 1,
      view: document.getElementById("game-canvas") as HTMLCanvasElement,
      resizeTo: window,
      eventMode: "passive",
      antialias: true,
    });

    this.attributes = new TopViewAttributes({
      areaWidth: window.innerWidth,
      areaHeight: window.innerHeight,
    });

    this.stage = TopViewStage.Start;
    this.playStageView = null;
    this.startStageView = null;

    this.absTime = 0;
    this.tickCallbacks = [];

    this.pixiApp.ticker.add(delta => {
      this.absTime += delta;
      this.handleTick(delta, this.absTime);
    });

    window.addEventListener("keydown", (ev: KeyboardEvent) => {
      ev.preventDefault();
    });
    window.addEventListener("keyup", (ev: KeyboardEvent) => {
      ev.preventDefault();
    });

    window.addEventListener("resize", () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      this.attributes.resize(width, height);
    });
  }

  public initStartStageView(): void {
    this.startStageView = new StartStageView({
      topViewAttributes: this.attributes,
      callbackApi: {
        connectToServer:
          this.callbackApi.startStage.connectToServer,
        disconnectFromServer:
          this.callbackApi.startStage.disconnectFromServer,
        currentGameSettings:
          this.callbackApi.startStage.currentGameSettings,
        validateGameSettings:
          this.callbackApi.startStage.validateGameSettings,
        setCurrentGameSettings:
          this.callbackApi.startStage.setCurrentGameSettings,
        hasGame:
          this.callbackApi.startStage.hasGame,
        createNewGame:
          this.callbackApi.startStage.createNewGame,
        setLoadGameProgressCallback:
          this.callbackApi.startStage.setLoadGameProgressCallback,
        loadGame:
          this.callbackApi.startStage.loadGame,

        switchFromStartToPlayStage:
          this.switchFromStartToPlayStage.bind(this),
      },
    });
    this.startStageView.x = 0;
    this.startStageView.y = 0;
    this.pixiApp.stage.addChild(this.startStageView);
  }

  public initPlayStageView(): void {
    this.playStageView = new PlayStageView({
      topViewAttributes: this.attributes,
      callbackApi: {
        localizePointerPosition: (point: PIXI.IPointData): PIXI.IPointData => {
          return this.pixiApp.stage.toLocal(point);
        },
        addTickCallback: (callback: (delta: number, absTime: number) => void) => {
          this.tickCallbacks.push(callback);
        },
        ...this.callbackApi.playStage,
      },
    });
    this.playStageView.x = 0;
    this.playStageView.y = 0;
    this.pixiApp.stage.addChild(this.playStageView);
  }

  public onRemoteDisconnect(): void {
    this.stage = TopViewStage.Start;
    this.pixiApp.stage.removeChild(this.playStageView!);
    this.playStageView = null;
    this.initStartStageView();
  }

  public switchFromStartToPlayStage(): void {
    if (this.stage !== TopViewStage.Start) {
      throw new Error(`Not in start stage: ${this.stage}`);
    }
    console.log("Switching from start stage to play stage.");
    this.stage = TopViewStage.Play;
    this.pixiApp.stage.removeChild(this.startStageView!);
    this.startStageView = null;
    this.initPlayStageView();
  }

  private handleTick(delta: number, absTime: number): void {
    for (const callback of this.tickCallbacks) {
      callback(delta, absTime);
    }
  }
}
