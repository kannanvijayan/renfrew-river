import * as PIXI from 'pixi.js';
import TopViewAttributes from '../top_view_attributes';
import { TileMapObserver, TileMapCommander } from './tile_map';
import { NORMAL_SCALE_TILE } from './hex';
import WorldMinimapData from '../../game/world_minimap_data';

export type MiniMapOptions = {
  topViewAttributes: TopViewAttributes;
  tileMapObserver: TileMapObserver;
  tileMapCommander: TileMapCommander;
  worldColumns: number;
  worldRows: number;
  miniWidth: number;
  // height is calculated from world column/row aspect ratio.
  minimapData: WorldMinimapData;
};

export default class MiniMap extends PIXI.Container {
  private readonly topViewAttributes: TopViewAttributes;
  private readonly tileMapObserver: TileMapObserver;
  private readonly tileMapCommander: TileMapCommander;
  private readonly worldColumns: number;
  private readonly worldRows: number;
  readonly miniWidth: number;
  readonly miniHeight: number;
  private readonly minimapData: WorldMinimapData;

  // The PIXI mesh object.
  private backingGraphics: PIXI.Graphics;
  private readonly mesh: PIXI.Mesh<PIXI.Shader>;
  private viewport: PIXI.Graphics;

  // Whether the mouse is currently down.
  private mouseDown: boolean = false;

  constructor(opts: Readonly<MiniMapOptions>) {
    super();
    const {
      topViewAttributes,
      tileMapObserver,
      tileMapCommander,
      worldColumns,
      worldRows,
      miniWidth,
      minimapData,
    } = opts;

    this.topViewAttributes = topViewAttributes;
    this.tileMapObserver = tileMapObserver;
    this.tileMapCommander = tileMapCommander;
    this.worldColumns = worldColumns;
    this.worldRows = worldRows;

    // In a column-oriented hex grid, columns are packed together
    // at a ratio of 3/4.
    const tilesPerPixel = (worldColumns * 3/4) / miniWidth;
    const miniHeight = worldRows / tilesPerPixel;
    this.miniWidth = miniWidth;
    this.miniHeight = miniHeight;

    this.minimapData = minimapData;

    this.backingGraphics = this.makeBackingGraphics();
    this.addChild(this.backingGraphics);

    this.mesh = this.makeMesh();
    this.mesh.x = 0;
    this.mesh.y = 0;
    this.addChild(this.mesh);

    this.width = miniWidth;
    this.height = miniHeight;

    this.viewport = this.makeViewport();
    this.addChild(this.viewport);

    // This is to handle map panning and zooming, which changes
    // the position and size of the viewport.
    this.tileMapObserver.addChangeListener(() => {
      this.removeAndAddViewport();
    });

    // This is to handle window resizing, which changes the size of
    // the viewport.
    this.topViewAttributes.addResizeListener((_width, _height) => {
      this.handleResize();
    });
  }

  private handleResize(): void {
    this.removeAndAddViewport();
  }

  private handleMouseDown(point: PIXI.IPointData): void {
    this.mouseDown = true;
    this.moveTileMapToMiniMapPoint(point);
  }

  private handleMouseMove(local: PIXI.IPointData): void {
    if (!this.mouseDown) {
      return;
    }
    this.moveTileMapToMiniMapPoint(local);
  }

  private handleMouseUp(): void {
    this.mouseDown = false;
  }

  private moveTileMapToMiniMapPoint(point: PIXI.IPointData): void {
    const worldColumn = point.x / this.miniWidth * this.worldColumns;
    const worldRow = point.y / this.miniHeight * this.worldRows;

    // Compute the normal-scale world point from the local point.
    const normalScaleWorldX = worldColumn * NORMAL_SCALE_TILE.mulWidth;
    const normalScaleWorldY = worldRow * NORMAL_SCALE_TILE.mulHeight;

    this.tileMapCommander.centerOnNormalScaleWorldPoint({
      x: normalScaleWorldX,
      y: normalScaleWorldY,
    });
  }

  private removeAndAddViewport(): void {
    this.removeChild(this.viewport);
    this.viewport = this.makeViewport();
    this.addChild(this.viewport);
  }

  private makeViewport(): PIXI.Graphics {
    const { x, y, width, height } = this.computeViewportPositionAndSize();
    const widthPx = width * this.miniWidth;
    const heightPx = height * this.miniHeight;

    const viewport = new PIXI.Graphics();
    // Overlay with a yellow rectangle.
    viewport.lineStyle({
      width: 1,
      color: 0xffff00,
      alpha: 1,
    });
    viewport.beginFill(0xffff00, 0.25);
    viewport.drawRect(0, 0, widthPx, heightPx);
    viewport.endFill();
    viewport.x = x * this.miniWidth;
    viewport.y = y * this.miniHeight;
    return viewport;
  }

  private computeViewportPositionAndSize()
    : { x: number, y: number, width: number, height: number }
  {
    const topLeftWorld = this.tileMapObserver.topLeftWorld();

    const xOffset =
      (topLeftWorld.x / NORMAL_SCALE_TILE.mulWidth) / this.worldColumns;
    const yOffset =
      (topLeftWorld.y / NORMAL_SCALE_TILE.mulHeight) / this.worldRows;

    const areaWidth = this.topViewAttributes.areaWidth;
    const areaHeight = this.topViewAttributes.areaHeight;
    const zoomLevel = this.tileMapObserver.zoomLevel();

    const widthInTiles =
      (areaWidth / NORMAL_SCALE_TILE.mulWidth) / zoomLevel;
    const heightInTiles =
      (areaHeight / NORMAL_SCALE_TILE.mulHeight) / zoomLevel;

    const width = widthInTiles / this.worldColumns;
    const height = heightInTiles / this.worldRows;
    return { x: xOffset, y: yOffset, width, height };
  }

  private makeMesh(): PIXI.Mesh<PIXI.Shader> {
    const rectangle = new PIXI.Geometry();
    const { miniWidth, miniHeight } = this;
    rectangle.addAttribute(`aVPos`, [
      0, 0,
      miniWidth, 0,
      miniWidth, miniHeight,
      0, miniHeight,
    ], 2);
    rectangle.addIndex([0, 1, 2, 0, 2, 3]);

    const elevTex = PIXI.Texture.fromBuffer(
      this.minimapData.elevations.array,
      this.minimapData.miniDims.columns,
      this.minimapData.miniDims.rows,
      {
        format: PIXI.FORMATS.RED,
        type: PIXI.TYPES.UNSIGNED_BYTE,
      }
    );

    const uniforms = {
      worldColumns: this.worldColumns,
      worldRows: this.worldRows,
      miniWidth,
      miniHeight,
      elevTex,
    };

    const shader = PIXI.Shader.from(
      `
      precision mediump float;
      attribute vec2 aVPos;

      uniform mat3 translationMatrix;
      uniform mat3 projectionMatrix;

      varying vec2 vUvs;

      void main() {
        gl_Position = vec4(
          (projectionMatrix * translationMatrix * vec3(aVPos, 1.0)).xy,
          0.0, 1.0
        );

        vUvs = aVPos;
      }
      `,

      `
      precision mediump float;

      varying vec2 vUvs;

      uniform float worldColumns;
      uniform float worldRows;
      uniform float miniWidth;
      uniform float miniHeight;
      uniform sampler2D elevTex;

      void main() {
        vec2 coord = vec2(vUvs.x / miniWidth, vUvs.y / miniHeight);
        float elevation = texture2D(elevTex, coord).r;
        if (elevation < 0.5) {
          // color blue, lower elevation is darker blue.
          gl_FragColor = vec4(
            0.1,
            0.1,
            elevation * 1.2,
            1.0
          );
        } else {
          gl_FragColor = vec4(
            (elevation - 0.5) * 2.0,
            (elevation - 0.5) * 2.0,
            (elevation - 0.5) * 2.0,
            1.0
          );
        }
      }
      `,

      uniforms
    );
    const mesh = new PIXI.Mesh(rectangle, shader);
    return mesh;
  }

  private makeBackingGraphics() {
    const backingGraphics = new PIXI.Graphics();
    backingGraphics.beginFill(0x000000);
    backingGraphics.drawRect(0, 0, this.miniWidth, this.miniHeight);
    backingGraphics.endFill();
    backingGraphics.eventMode = "static";
    backingGraphics.onmousedown = (e: PIXI.FederatedMouseEvent) => {
      const local = backingGraphics.toLocal(e.global);
      e.stopPropagation();
      e.stopImmediatePropagation();
      this.handleMouseDown(local);
    };
    backingGraphics.onmousemove = (e: PIXI.FederatedMouseEvent) => {
      const local = backingGraphics.toLocal(e.global);
      e.stopPropagation();
      e.stopImmediatePropagation();
      this.handleMouseMove(local);
    };
    backingGraphics.onmouseup = 
    backingGraphics.onmouseupoutside =
      (e: PIXI.FederatedMouseEvent) => {
        e.stopPropagation();
        e.stopImmediatePropagation();
        this.handleMouseUp();
      };
    return backingGraphics;
  }
}
