import * as PIXI from 'pixi.js';
import GameMenuTitle from '../common/game_menu_title';
import GameMenuSubtitle from '../common/game_menu_subtitle';

export default class GameLoadingView extends PIXI.Container {
  private graphics: PIXI.Graphics;

  constructor() {
    super();

    this.graphics = new PIXI.Graphics();
    this.buildView(0);
  }

  public setProgress(progress: number, label?: string) {
    this.removeChildren();
    this.graphics = new PIXI.Graphics();
    this.buildView(progress, label);
  }

  private buildView(progress: number, label?: string) {
    const menuTitle = new GameMenuTitle();
    menuTitle.x = 5;
    menuTitle.y = 5;

    const text = label || "Loading...";

    const menuSubtitle = new GameMenuSubtitle({ text });
    menuSubtitle.x = 5;
    menuSubtitle.y = menuTitle.y + menuTitle.height + 3;

    const progressBar = new LoadingProgressBar({
      width: 200,
      progress: progress,
    });
    progressBar.x = 100;
    progressBar.y = menuSubtitle.y + menuSubtitle.height + 25;

    this.graphics.addChild(menuTitle);
    this.graphics.addChild(menuSubtitle);
    this.graphics.addChild(progressBar);

    this.graphics.beginFill(0x404040);
    this.graphics.lineStyle(5, 0x202020);
    this.graphics.drawRoundedRect(
      0, 0, this.graphics.width + 10, this.graphics.height + 50, 10);
    this.graphics.endFill();

    this.addChild(this.graphics);
  }
}

class LoadingProgressBar extends PIXI.Container {
  constructor(opts: {
    width: number,
    progress: number,
  }) {
    const { width, progress } = opts;
    super();

    const bg = new PIXI.Graphics();
    bg.beginFill(0x808040);
    bg.lineStyle(3, 0x404020);
    bg.drawRoundedRect(0, 0, width, 20, 10);
    bg.endFill();
    bg.x = 0;
    bg.y = 0;

    const fg = new PIXI.Graphics();
    fg.beginFill(0xc0c080);
    fg.lineStyle(0);
    fg.drawRoundedRect(0, 0, (width - 10) * progress, 14, 5);
    fg.endFill();
    fg.x = 5;
    fg.y = 3;

    this.addChild(bg);
    this.addChild(fg);
  }
}
