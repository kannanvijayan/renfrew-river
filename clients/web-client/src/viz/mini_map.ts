import * as PIXI from 'pixi.js';
import { WorldDims } from 'renfrew-river-protocol-client';
import WorldMinimapData from '../simulation/map/world_minimap_data';
import CellMapAccess from './cell_map_access';
import { NORMAL_SCALE_CELL } from './hex';
import TextureRefresher from './texture_refresher';

export type MiniMapOptions = {
  screenSize: { width: number, height: number },
  cellMapAccess: CellMapAccess,
  worldDims: WorldDims,
  miniDims: WorldDims,
  minimapData: WorldMinimapData,
};

export default class MiniMap extends PIXI.Container {
  private readonly cellMapAccess: CellMapAccess;
  private readonly worldDims: WorldDims;
  readonly miniDims: WorldDims;
  private readonly minimapData: WorldMinimapData;

  // The PIXI mesh object.
  private backingGraphics: PIXI.Graphics;
  private readonly mesh: PIXI.Mesh<PIXI.Shader>;
  private viewport: PIXI.Graphics;
  private readonly texture: PIXI.Texture;
  private readonly textureRefresher: TextureRefresher;

  // Whether the mouse is currently down.
  private mouseDown: boolean = false;

  constructor(opts: Readonly<MiniMapOptions>) {
    super();
    const {
      screenSize,
      cellMapAccess,
      worldDims,
      miniDims,
      minimapData,
    } = opts;

    this.cellMapAccess = cellMapAccess;
    this.worldDims = worldDims;

    // In a column-oriented hex grid, columns are packed together
    // at a ratio of 3/4.
    this.miniDims = miniDims;
    this.minimapData = minimapData;

    this.backingGraphics = this.makeBackingGraphics();
    this.texture = this.makeTexture();
    this.textureRefresher = new TextureRefresher(this.texture);
    this.mesh = this.makeMesh(this.texture);
    this.viewport = this.makeViewport(screenSize);
    this.addChild(this.backingGraphics);
    this.addChild(this.mesh);
    this.addChild(this.viewport);

    this.init();
  }

  private init(): void {
    this.mesh.x = 0;
    this.mesh.y = 0;

    this.width = this.miniDims.columns;
    this.height = this.miniDims.rows;

    // This is to handle map panning and zooming, which changes
    // the position and size of the viewport.
    this.cellMapAccess.addChangeListener(() => {
      this.removeAndAddViewport(this.cellMapAccess.screenSize());
    });

    this.minimapData.addRefreshListener(() => {
      // TODO: re-enable.
      console.log("KVKV updating from source data", {
        array: this.minimapData.getTextureSource().array,
      });
      this.textureRefresher.update();
    })
  }

  public resize(screenSize: { width: number, height: number }): void {
    console.log("Resizing minimap");
    this.removeAndAddViewport(screenSize);
  }

  private handleMouseDown(point: PIXI.IPointData): void {
    this.mouseDown = true;
    this.moveCellMapToMiniMapPoint(point);
  }

  private handleMouseMove(local: PIXI.IPointData): void {
    if (!this.mouseDown) {
      return;
    }
    this.moveCellMapToMiniMapPoint(local);
  }

  private handleMouseUp(): void {
    this.mouseDown = false;
  }

  private moveCellMapToMiniMapPoint(point: PIXI.IPointData): void {
    const worldColumn = point.x / this.miniDims.columns * this.worldDims.columns;
    const worldRow = point.y / this.miniDims.rows * this.worldDims.rows;

    // Compute the normal-scale world point from the local point.
    const normalScaleWorldX = worldColumn * NORMAL_SCALE_CELL.mulWidth;
    const normalScaleWorldY = worldRow * NORMAL_SCALE_CELL.mulHeight;

    this.cellMapAccess.centerOnNormalScaleWorldPoint({
      x: normalScaleWorldX,
      y: normalScaleWorldY,
    });
  }

  private removeAndAddViewport(screenSize: { width: number, height: number}): void {
    this.removeChild(this.viewport);
    this.viewport = this.makeViewport(screenSize);
    this.addChild(this.viewport);
  }

  private makeViewport(screenSize: { width: number, height: number })
    : PIXI.Graphics
  {
    const { x, y, width, height } =
      this.computeViewportPositionAndSize(screenSize);
    const widthPx = width * this.miniDims.columns;
    const heightPx = height * this.miniDims.rows;

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
    viewport.x = x * this.miniDims.columns;
    viewport.y = y * this.miniDims.rows;
    return viewport;
  }

  private computeViewportPositionAndSize(
    screenSize: { width: number, height: number },
  ): { x: number, y: number, width: number, height: number }
  {
    const topLeftWorld = this.cellMapAccess.topLeftWorld();

    const xOffset =
      (topLeftWorld.x / NORMAL_SCALE_CELL.mulWidth) / this.worldDims.columns
    const yOffset =
      (topLeftWorld.y / NORMAL_SCALE_CELL.mulHeight) / this.worldDims.rows;

    const zoomLevel = this.cellMapAccess.zoomLevel();

    const widthInCells =
      (screenSize.width / NORMAL_SCALE_CELL.mulWidth) / zoomLevel;
    const heightInCells =
      (screenSize.height / NORMAL_SCALE_CELL.mulHeight) / zoomLevel;

    const width = widthInCells / this.worldDims.columns;
    const height = heightInCells / this.worldDims.rows;
    return { x: xOffset, y: yOffset, width, height };
  }

  private makeTexture(): PIXI.Texture {
    console.log("KVKV Minimap makeTexture");
    const { miniDims } = this;
    const textureSource = this.minimapData.getTextureSource();
    const texture = PIXI.Texture.fromBuffer(
      textureSource.array,
      miniDims.columns,
      miniDims.rows,
      {
        format: PIXI.FORMATS.RED,
        type: PIXI.TYPES.FLOAT,
      }
    );
    return texture;
  }

  private makeMesh(texture: PIXI.Texture): PIXI.Mesh<PIXI.Shader> {
    const rectangle = new PIXI.Geometry();
    const { miniDims } = this;
    console.log("KVKV makeMesh", { ...miniDims });
    rectangle.addAttribute(`aVertexPosition`, [
      0,                 0,
      miniDims.columns,  0,
      miniDims.columns,  miniDims.rows,
      0,                 0,
      0,                 miniDims.rows,
      miniDims.columns,  miniDims.rows,
    ], 2);

    const uniforms = {
      worldColumns: this.worldDims.columns,
      worldRows: this.worldDims.rows,
      miniWidth: miniDims.columns,
      miniHeight: miniDims.rows,
      dataTex: texture,
    };

    const shader = PIXI.Shader.from(VERTEX_SHADER, FRAGMENT_SHADER, uniforms);
    const mesh = new PIXI.Mesh(rectangle, shader);
    mesh.eventMode = "none";
    return mesh;
  }

  private makeBackingGraphics() {
    const backingGraphics = new PIXI.Graphics();
    backingGraphics.beginFill(0xff0080);
    backingGraphics.drawRect(0, 0, this.miniDims.columns, this.miniDims.rows);
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

const VERTEX_SHADER = (`
  precision mediump float;
  attribute vec2 aVertexPosition;

  uniform mat3 translationMatrix;
  uniform mat3 projectionMatrix;

  varying vec2 vUvs;

  void main() {
    gl_Position = vec4(
      (projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy,
      0.0, 1.0
    );

    vUvs = aVertexPosition;
  }
`);

const FRAGMENT_SHADER = (`
  precision mediump float;

  varying vec2 vUvs;

  uniform float worldColumns;
  uniform float worldRows;
  uniform float miniWidth;
  uniform float miniHeight;
  uniform sampler2D dataTex;

  void main() {
    vec2 coord = vec2(vUvs.x / miniWidth, vUvs.y / miniHeight);
    float elevation = texture2D(dataTex, coord).r;
    if (elevation <= 0.0) {
      gl_FragColor = vec4(0.0, 1.0, 0.8, 1.0);
    } else if (elevation < 0.5) {
      // color blue, lower elevation is darker blue.
      gl_FragColor = vec4(
        0.1,
        elevation * 1.5,
        elevation * 2.0,
        1.0
      );
    } else if (elevation < 1.0) {
      gl_FragColor = vec4(
        (elevation - 0.4) * 1.5,
        (elevation - 0.4) * 0.9,
        (elevation - 0.4) * 1.2,
        1.0
      );
    } else {
      gl_FragColor = vec4(1.0, 0.0, 0.8, 1.0);
    }
  }
`);
