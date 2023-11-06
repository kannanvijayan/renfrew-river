import * as PIXI from "pixi.js";
import { TileMapObserver } from "./tile_map";
import { CellCoord } from "../../game/types/cell_coord";

export default class CellInfoPanel extends PIXI.Container {
  private tileMapObserver: TileMapObserver;
  private graphics: PIXI.Graphics;
  private currentHoverCellText: PIXI.Text | null = null;

  constructor(opts: { tileMapObserver: TileMapObserver }) {
    super();
    this.tileMapObserver = opts.tileMapObserver;

    const width = 200;
    const height = 200;
    const bgColor = 0x202020;

    // Draw background.
    this.graphics = new PIXI.Graphics();
    this.graphics.beginFill(bgColor);
    this.graphics.lineStyle(0);
    this.graphics.drawRect(0, 0, width, height);
    this.graphics.endFill();
    this.addChild(this.graphics);

    const text = new PIXI.Text("Cell Info Panel", {
      fontSize: 20,
      fill: 0xffffff,
    });
    text.x = 10;
    text.y = 10;
    this.graphics.addChild(text);

    this.tileMapObserver.addHoverCellChangedListener(
      this.handleHoverCellChanged.bind(this)
    )
  }

  private handleHoverCellChanged(cell: CellCoord): void {
    if (this.currentHoverCellText) {
      this.graphics.removeChild(this.currentHoverCellText);
      this.currentHoverCellText = null;
    }
    const text = new PIXI.Text(`Cell: ${cell.col}, ${cell.row}`, {
      fontSize: 15,
      fill: 0xffffff,
    });
    text.x = 10;
    text.y = 40;
    this.currentHoverCellText = text;
    this.graphics.addChild(text);
  }
}
