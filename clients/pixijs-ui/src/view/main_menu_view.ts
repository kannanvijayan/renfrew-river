import * as PIXI from 'pixi.js';
import TopView from './top_view';

export default class MainMenuView extends PIXI.Container {
  private gameView: TopView;
  private pixiApp: PIXI.Application;
  private graphics: PIXI.Graphics;
  private title: MainMenuTitle;
  private connectButton: MainMenuButton;

  constructor(gameView: TopView, app: PIXI.Application) {
    super();
    this.gameView = gameView;
    this.pixiApp = gameView.pixiApp;

    this.graphics = new PIXI.Graphics();

    const title = new MainMenuTitle({ text: "Renfrew River" });
    title.x = 5;
    title.y = 5;
    this.title = title;
    this.graphics.addChild(title);

    const button = new MainMenuButton({ text: "Connect" });
    button.x = 50;
    button.y = title.x + title.height + 25;
    this.connectButton = button;
    this.graphics.addChild(button);

    this.graphics.beginFill(0x404040);
    this.graphics.lineStyle(5, 0x202020);
    this.graphics.drawRect(
      0, 0, this.graphics.width + 10, this.graphics.height + 50);
    this.graphics.endFill();
    this.addChild(this.graphics);

    this.pixiApp.stage.addChild(this);
    this.centerInScreen();
  }

  public handleResize(width: number, height: number): void {
    this.centerInScreen();
  }

  private centerInScreen(): void {
    this.x = this.pixiApp.screen.width / 2 - this.width / 2;
    this.y = this.pixiApp.screen.height / 2 - this.height / 2;
  }
}

class MainMenuTitle extends PIXI.Container {
  private graphics: PIXI.Graphics;
  constructor(opts: {
    text: string,
  }) {
    const { text } = opts;
    super();

    this.graphics = new PIXI.Graphics();
    this.graphics.beginFill(0x408040);
    this.graphics.lineStyle(0);
    this.graphics.drawRect(0, 0, 390, 95);
    this.graphics.endFill();
    this.addChild(this.graphics);

    const textItem = new PIXI.Text(text, {
      fontSize: 40,
      fontVariant: "small-caps",
    });
    textItem.anchor.set(0.5);
    textItem.x = 195;
    textItem.y = 50;
    this.graphics.addChild(textItem);
  }
}

class MainMenuButton extends PIXI.Container {
  private graphics: PIXI.Graphics;
  constructor(opts: {
    text: string,
  }) {
    const { text } = opts;
    super();

    this.graphics = new PIXI.Graphics();
    this.graphics.beginFill(0x408040);
    this.graphics.lineStyle(3, 0x204020);
    this.graphics.drawRoundedRect(0, 0, 300, 50, 20);
    this.graphics.endFill();
    this.addChild(this.graphics);

    const textItem = new PIXI.Text(text, {
      fontSize: 30,
      fontVariant: "small-caps",
    });
    textItem.anchor.set(0.5);
    textItem.x = 150;
    textItem.y = 25;
    this.graphics.addChild(textItem);
  }
}