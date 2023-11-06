import * as PIXI from "pixi.js";
import { TileMapObserver } from "./tile_map";
import { CellCoord } from "../../game/types/cell_coord";
import { CellInfo } from "../../game/types/cell_info";
import WorldObserver from "../../game/world_observer";

export type CellInfoPanelCallbackApi = {
  getCellInfo: (cell: CellCoord) => Promise<CellInfo>;
};

export default class CellInfoPanel extends PIXI.Container {
  private callbackApi: CellInfoPanelCallbackApi;
  private worldObserver: WorldObserver;
  private tileMapObserver: TileMapObserver;
  private backgroundGraphics: PIXI.Graphics;
  private currentHoverCellText: PIXI.Text | null;
  private currentElevationText: PIXI.Text | null;
  private currentAnimalIdText: PIXI.Text | null;

  constructor(opts: {
    callbackApi: CellInfoPanelCallbackApi,
    worldObserver: WorldObserver,
    tileMapObserver: TileMapObserver,
  }) {
    super();
    this.callbackApi = opts.callbackApi;
    this.worldObserver = opts.worldObserver;
    this.tileMapObserver = opts.tileMapObserver;

    const width = 200;
    const height = 200;
    const bgColor = 0x202020;

    // Draw background.
    this.backgroundGraphics = new PIXI.Graphics();
    this.backgroundGraphics.beginFill(bgColor);
    this.backgroundGraphics.lineStyle(0);
    this.backgroundGraphics.drawRect(0, 0, width, height);
    this.backgroundGraphics.endFill();
    this.addChild(this.backgroundGraphics);

    this.currentHoverCellText = null;
    this.currentElevationText = null;
    this.currentAnimalIdText = null;

    const text = new PIXI.Text("Cell Info Panel", {
      fontSize: 20,
      fill: 0xffffff,
    });
    text.x = 10;
    text.y = 10;
    this.backgroundGraphics.addChild(text);

    this.tileMapObserver.addHoverCellChangedListener(
      this.handleHoverCellChanged.bind(this)
    )
  }

  private async handleHoverCellChanged(cell: CellCoord): Promise<void> {
    const cellInfo = await this.callbackApi.getCellInfo(cell);

    if (this.currentHoverCellText) {
      this.backgroundGraphics.removeChild(this.currentHoverCellText);
      this.currentHoverCellText = null;
    }
    if (this.currentElevationText) {
      this.backgroundGraphics.removeChild(this.currentElevationText);
      this.currentElevationText = null;
    }
    if (this.currentAnimalIdText) {
      this.backgroundGraphics.removeChild(this.currentAnimalIdText);
      this.currentAnimalIdText = null;
    }

    // Show the hovered cell coordinates.
    const text = new PIXI.Text(`Cell: ${cell.col}, ${cell.row}`, {
      fontSize: 15,
      fill: 0xffffff,
    });
    text.x = 10;
    text.y = 40;
    this.currentHoverCellText = text;
    this.backgroundGraphics.addChild(text);

    // Show the cell elevation.
    const localElevation = this.worldObserver.mapData().fullElevations.valueAt(
      cell.col, cell.row
    );
    const elevationText = new PIXI.Text(
      `Elevation: ${cellInfo.elevation} (${localElevation})`,
      {
        fontSize: 15,
        fill: 0xffffff,
      }
    );
    elevationText.x = 10;
    elevationText.y = 70;
    this.currentElevationText = elevationText;
    this.backgroundGraphics.addChild(elevationText);

    // Show the animal id.
    const animalIdText = new PIXI.Text(`Animal: ${cellInfo.animal_id}`, {
      fontSize: 15,
      fill: 0xffffff,
    });
    animalIdText.x = 10;
    animalIdText.y = 100;
    this.currentAnimalIdText = animalIdText;
    this.backgroundGraphics.addChild(animalIdText);
  }
}
