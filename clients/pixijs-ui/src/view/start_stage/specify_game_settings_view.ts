import * as PIXI from 'pixi.js';
import * as PIXI_UI from '@pixi/ui';
import GameMenuTitle from '../common/game_menu_title';
import GameMenuSubtitle from '../common/game_menu_subtitle';
import MenuButton from '../common/menu_button';
import { GameSettings } from '../../client/protocol/types/settings';
import ErrorMessage from '../common/error_message';

export type SpecifyGameSettingsCallbackApi = {
  validateGameSettings(settings: GameSettings, errors: string[]): boolean;

  switchToConnectedMainMenuView(settings: GameSettings | null): void;
}

type SpecifyGameSettingsData = {
  columns: string;
  rows: string;
  randSeed: string;
};

export default class SpecifyGameSettingsView extends PIXI.Container {
  private readonly callbackApi: SpecifyGameSettingsCallbackApi;
  private readonly data: SpecifyGameSettingsData;
  private graphics: PIXI.Graphics;

  constructor(opts: {
    callbackApi: SpecifyGameSettingsCallbackApi,
    currentGameSettings: GameSettings,
  }) {
    const { callbackApi, currentGameSettings } = opts;
    super();

    this.callbackApi = callbackApi;
    this.data = {
      columns: currentGameSettings.world_dims.columns.toString(),
      rows: currentGameSettings.world_dims.rows.toString(),
      randSeed: currentGameSettings.rand_seed.toString(),
    };
    this.graphics = new PIXI.Graphics();
    this.build();
  }

  private validateData(): GameSettings | false {
    const errors: string[] = [];
    if (this.data.columns.length === 0) {
      this.rebuildWithError("Width must be specified");
      return false;
    }
    if (!this.data.columns.match(/^[0-9]+$/)) {
      this.rebuildWithError("Width must be a number");
      return false;
    }
    if (this.data.rows.length === 0) {
      this.rebuildWithError("Height must be specified");
      return false;
    }
    if (!this.data.rows.match(/^[0-9]+$/)) {
      this.rebuildWithError("Height must be a number");
      return false;
    }
    if (this.data.randSeed.length === 0) {
      this.rebuildWithError("Random seed must be specified");
      return false;
    }
    if (!this.data.randSeed.match(/^[0-9]+$/)) {
      this.rebuildWithError("Random seed must be a number");
      return false;
    }

    const newGameSettings: GameSettings = {
      world_dims: {
        columns: parseInt(this.data.columns),
        rows: parseInt(this.data.rows),
      },
      rand_seed: parseInt(this.data.randSeed),
    };
    if (!this.callbackApi.validateGameSettings(newGameSettings, errors)) {
      this.rebuildWithError(`Invalid game settings: ${errors[0]}`);
      return false;
    }

    return newGameSettings;
  }

  private rebuildWithError(validationError: string): void {
    this.removeChildren();
    this.graphics = new PIXI.Graphics();
    this.build(validationError);
  }

  private build(validationError?: string): void {
    const menuTitle = new GameMenuTitle();
    menuTitle.x = 5;
    menuTitle.y = 5;

    const menuSubtitle = new GameMenuSubtitle({ text: "Specify Game Settings" });
    menuSubtitle.x = 5;
    menuSubtitle.y = menuTitle.y + menuTitle.height + 3;

    const widthInputLabel = new PIXI.Text("Width", {
      fontSize: 15,
      fontVariant: "small-caps",
    });
    widthInputLabel.x = 50;
    widthInputLabel.y = menuSubtitle.y + menuSubtitle.height + 25;

    const widthInput = new WidthInput({ data: this.data });
    widthInput.x = 50;
    widthInput.y = widthInputLabel.y + widthInputLabel.height + 5;

    const heightInputLabel = new PIXI.Text("Height", {
      fontSize: 15,
      fontVariant: "small-caps",
    });
    heightInputLabel.x = 50;
    heightInputLabel.y = widthInput.y + widthInput.height + 25;

    const heightInput = new HeightInput({ data: this.data });
    heightInput.x = 50;
    heightInput.y = heightInputLabel.y + heightInputLabel.height + 5;

    const randSeedInputLabel = new PIXI.Text("Random Seed", {
      fontSize: 15,
      fontVariant: "small-caps",
    });
    randSeedInputLabel.x = 50;
    randSeedInputLabel.y = heightInput.y + heightInput.height + 25;

    const randSeedInput = new RandSeedInput({ data: this.data });
    randSeedInput.x = 50;
    randSeedInput.y = randSeedInputLabel.y + randSeedInputLabel.height + 5;

    let validationErrorText: ErrorMessage | null = null;
    if (validationError) {
      validationErrorText = new ErrorMessage({ text: validationError });
      validationErrorText.x = 50;
      validationErrorText.y = randSeedInput.y + randSeedInput.height + 25;
    }

    const okButton = new OkButton({
      onClick: () => {
        const newGameSettings = this.validateData();
        console.log("newGameSettings", newGameSettings);
        if (newGameSettings) {
          this.callbackApi.switchToConnectedMainMenuView(newGameSettings);
        }
      },
      data: this.data,
    });
    okButton.x = 50;
    if (validationErrorText) {
      okButton.y = validationErrorText.y + validationErrorText.height + 25;
    } else {
      okButton.y = randSeedInput.y + randSeedInput.height + 25;
    }
    
    const cancelButton = new CancelButton({
      onClick: () => {
        this.callbackApi.switchToConnectedMainMenuView(null);
      },
    });
    cancelButton.x = 200;
    if (validationErrorText) {
      cancelButton.y = validationErrorText.y + validationErrorText.height + 25;
    } else {
      cancelButton.y = randSeedInput.y + randSeedInput.height + 25;
    }

    this.graphics.addChild(menuTitle);
    this.graphics.addChild(menuSubtitle);
    this.graphics.addChild(widthInputLabel);
    this.graphics.addChild(widthInput);
    this.graphics.addChild(heightInputLabel);
    this.graphics.addChild(heightInput);
    this.graphics.addChild(randSeedInputLabel);
    this.graphics.addChild(randSeedInput);
    if (validationErrorText) {
      this.graphics.addChild(validationErrorText);
    }
    this.graphics.addChild(okButton);
    this.graphics.addChild(cancelButton);

    this.graphics.beginFill(0x404040);
    this.graphics.lineStyle(5, 0x202020);
    this.graphics.drawRoundedRect(
      0, 0, this.graphics.width + 10, this.graphics.height + 50, 10);
    this.graphics.endFill();
    this.addChild(this.graphics);
  }
}

class WidthInput extends PIXI_UI.Input {
  constructor(opts: { data: SpecifyGameSettingsData }) {
    const { data } = opts;
    const bg = new PIXI.Graphics();
    bg.beginFill(0x808040);
    bg.lineStyle(0);
    bg.drawRect(0, 0, 300, 60);
    bg.endFill();
    super({
      bg,
      padding: 10,
      value: data.columns,
    });

    this.onChange.connect((text) => {
      data.columns = text;
    });
  }
}

class HeightInput extends PIXI_UI.Input {
  constructor(opts: { data: SpecifyGameSettingsData }) {
    const { data } = opts;
    const bg = new PIXI.Graphics();
    bg.beginFill(0x808040);
    bg.lineStyle(0);
    bg.drawRect(0, 0, 300, 60);
    bg.endFill();
    super({
      bg,
      padding: 10,
      value: data.rows,
    });

    this.onChange.connect((text) => {
      data.rows = text;
    });
  }
}

class RandSeedInput extends PIXI_UI.Input {
  constructor(opts: { data: SpecifyGameSettingsData }) {
    const { data } = opts;
    const bg = new PIXI.Graphics();
    bg.beginFill(0x808040);
    bg.lineStyle(0);
    bg.drawRect(0, 0, 300, 60);
    bg.endFill();
    super({
      bg,
      padding: 10,
      value: data.randSeed,
    });

    this.onChange.connect((text) => {
      data.randSeed = text;
    });
  }
}

class OkButton extends MenuButton {
  constructor(opts: {
    onClick: () => void,
    data: SpecifyGameSettingsData,
  }) {
    const { onClick } = opts;
    super({
      name: "SpecifyGameSettings.Ok",
      text: "Ok",
      width: 100,
      onClickListener: onClick
    });
  }
}

class CancelButton extends MenuButton {
  constructor(opts: {
    onClick: () => void,
  }) {
    const { onClick } = opts;
    super({
      name: "SpecifyGameSettings.Cancel",
      text: "Cancel",
      width: 100,
      color: 0x804040,
      onClickListener: onClick
    });
  }
}