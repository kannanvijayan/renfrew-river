import * as PIXI from 'pixi.js';
import {
  HEX_TRIANGLES_CLIP,
  NORMAL_SCALE_CELL,
  normalOffsetXForCellBoundingBox,
  normalOffsetYForCellBoundingBox
} from './hex';
import Deferred from '../../util/deferred';
import WorldMapTiledData from '../../game/world_map_tiled_data';

export default class HexMesh {
  public readonly elevationsTexture: PIXI.Texture;
  public readonly animalKindsTexture: PIXI.Texture;
  public readonly mesh: PIXI.Mesh<PIXI.Shader>;
  private dispatchedUpdateListeners: Deferred<void>[];
  private pendingUpdateListeners: Deferred<void>[];
  private updateInProgress: number;

  public constructor(opts: {
    columns: number,
    rows: number,
    worldColumns: number,
    worldRows: number,
    mapData: WorldMapTiledData,
    topLeftWorldColumn: number,
    topLeftWorldRow: number,
  }) {
    const {
      columns,
      rows,
      worldColumns,
      worldRows,
      mapData,
      topLeftWorldColumn,
      topLeftWorldRow,
    } = opts;

    // Create elevations texture.
    const elevationsTexture = PIXI.Texture.fromBuffer(
      mapData.elevations.array,
      worldColumns,
      worldRows,
      {
        format: PIXI.FORMATS.RED,
        type: PIXI.TYPES.UNSIGNED_BYTE,
      }
    );
    elevationsTexture.baseTexture.addListener(
      "update",
      this.handleTextureUpdated.bind(this)
    );

    // Create animal kinds texture.
    const animalKindsTexture = PIXI.Texture.fromBuffer(
      mapData.animalKinds.array,
      worldColumns,
      worldRows,
      {
        format: PIXI.FORMATS.RED,
        type: PIXI.TYPES.UNSIGNED_BYTE,
      }
    );
    animalKindsTexture.baseTexture.addListener(
      "update",
      this.handleTextureUpdated.bind(this)
    );

    const geometry = makeGeometry({ columns, rows });
    const shader = makeShader({
      columns,
      rows,
      worldColumns,
      worldRows,
      topLeftWorldColumn,
      topLeftWorldRow,
      elevationsTexture,
      animalKindsTexture,
    });

    this.elevationsTexture = elevationsTexture;
    this.animalKindsTexture = animalKindsTexture;
    this.mesh = new PIXI.Mesh(geometry, shader);
    this.dispatchedUpdateListeners = [];
    this.pendingUpdateListeners = [];
    this.updateInProgress = 0;
  }

  public updateTextures(): Promise<void> {
    const deferred = new Deferred<void>();
    if (this.updateInProgress) {
      // If update in progress, add the current request to the list of
      // pending update listeners.
      this.pendingUpdateListeners.push(deferred);
    } else {
      // Otherwise, invoke an update, and add the current request to the list
      // of dispatched update listeners.
      this.updateInProgress = 2;
      // ASSERT: this.dispatchedUpdateListeners.length === 0
      this.dispatchedUpdateListeners.push(deferred);

      this.elevationsTexture.update();
      this.animalKindsTexture.update();
    }
    return deferred.getPromise();
  }

  private handleTextureUpdated() {
    // ASSERT: this.updateInProgress > 0
    // ASSERT: this.dispatchedUpdateListeners.length > 0
    this.updateInProgress--;
    if (this.updateInProgress > 0) {
      // Still waiting for texture updates to finish.
      return;
    }

    const invokeListeners = this.dispatchedUpdateListeners;

    if (this.pendingUpdateListeners.length > 0) {
      // Schedule another update and make the pending listeners the dispatched.
      this.updateInProgress = 2;
      this.elevationsTexture.update();
      this.animalKindsTexture.update();
      this.dispatchedUpdateListeners = this.pendingUpdateListeners;
      this.pendingUpdateListeners = [];
      // Leave updateInProgress as true.
    } else {
      // No more pending listeners, so clear the dispatched listeners.
      this.dispatchedUpdateListeners = [];
    }

    // Resolve the prior set of dispatched listeners.
    for (const deferred of invokeListeners) {
      deferred.resolvePromise();
    }
  }
}

function makeGeometry(opts: {
  columns: number,
  rows: number,
}) {
  const { columns, rows } = opts;

  const hexTriangles = [
    ...HEX_TRIANGLES_CLIP.north,
    ...HEX_TRIANGLES_CLIP.northeast,
    ...HEX_TRIANGLES_CLIP.southeast,
    ...HEX_TRIANGLES_CLIP.south,
    ...HEX_TRIANGLES_CLIP.southwest,
    ...HEX_TRIANGLES_CLIP.northwest,
  ];

  const geometry = new PIXI.Geometry();
  geometry.addAttribute('aVPos', hexTriangles);

  geometry.instanced = true;
  geometry.instanceCount = columns * rows;

  const positionSize = 2;
  const colorSize = 3;

  const positionBuffer = new PIXI.Buffer(
    new Float32Array(geometry.instanceCount * positionSize)
  );
  const colorBuffer = new PIXI.Buffer(
    new Float32Array(geometry.instanceCount * colorSize)
  );
  const uvBuffer = new PIXI.Buffer(
    new Float32Array(geometry.instanceCount * 2)
  );

  geometry.addAttribute(
    'aIPos',
    positionBuffer,
    positionSize,
    false,
    PIXI.TYPES.FLOAT,
    4 * positionSize,
    0,
    true
  );

  geometry.addAttribute(
    'aICol',
    colorBuffer,
    colorSize,
    false,
    PIXI.TYPES.FLOAT,
    4 * colorSize,
    0,
    true
  );

  geometry.addAttribute(
    'aIUv',
    uvBuffer,
    2,
    false,
    PIXI.TYPES.FLOAT,
    4 * 2,
    0,
    true
  );

  for (let x = 0; x < columns; x++) {
    for (let y = 0; y < rows; y++) {
      const idx = y * columns + x;

      const xOffset = normalOffsetXForCellBoundingBox(x, y);
      const yOffset = normalOffsetYForCellBoundingBox(x, y);

      let colorRed = (Math.random() / 2);
      let colorGreen = (Math.random() / 2);
      let colorBlue = (Math.random() / 2);
      if (x == 0 || y == 0 || x == columns - 1 || y == rows - 1) {
        colorRed = 1 - ((x % 2) * 0.25);
        colorGreen = 0;
        colorBlue = 0;
      }
      if (
        (x == 1 || y == 1 || x == columns - 2 || y == rows - 2) &&
        (x >= 1 && y >= 1 && x <= columns - 2 && y <= rows - 2)
      ) {
        colorRed = 0;
        colorGreen = 1 - ((x % 2) * 0.25);
        colorBlue = 0;
      }
      if (
        (x == 2 || y == 2 || x == columns - 3 || y == rows - 3) && 
        (x >= 2 && y >= 2 && x <= columns - 3 && y <= rows - 3)
      ) {
        colorRed = 0;
        colorGreen = 0;
        colorBlue = 1 - ((x % 2) * 0.25);
      }

      const instancePosOffset = idx * positionSize;
      positionBuffer.data[instancePosOffset + 0] = xOffset;
      positionBuffer.data[instancePosOffset + 1] = yOffset;

      // The UV just identifies the column/row of the cell.
      const instanceUvOffset = idx * 2;
      uvBuffer.data[instanceUvOffset + 0] = x;
      uvBuffer.data[instanceUvOffset + 1] = y;

      const instanceColOffset = idx * colorSize;
      colorBuffer.data[instanceColOffset + 0] = colorRed;
      colorBuffer.data[instanceColOffset + 1] = colorGreen;
      colorBuffer.data[instanceColOffset + 2] = colorBlue;
    }
  }

  return geometry;
}

function makeShader(opts: {
  columns: number,
  rows: number,
  worldColumns: number,
  worldRows: number,
  topLeftWorldColumn: number,
  topLeftWorldRow: number,
  elevationsTexture: PIXI.Texture,
  animalKindsTexture: PIXI.Texture,
}) {
  const {
    columns,
    rows,
    worldColumns,
    worldRows,
    topLeftWorldColumn,
    topLeftWorldRow,
    animalKindsTexture,
    elevationsTexture,
  } = opts;
  const uniforms = {
    columns,
    rows,
    worldColumns,
    worldRows,
    topLeftWorldColumn,
    topLeftWorldRow,
    elevationTex: elevationsTexture,
    animalKindTex: animalKindsTexture,
  };

  const adjX = NORMAL_SCALE_CELL.width / 2;
  const adjY = NORMAL_SCALE_CELL.height / 2;

  const shader = PIXI.Shader.from(
    `
    precision mediump float;
    attribute vec2 aVPos;
    attribute vec2 aIPos;
    attribute vec3 aICol;
    attribute vec2 aIUv;

    uniform mat3 translationMatrix;
    uniform mat3 projectionMatrix;

    varying vec3 vCol;
    varying vec2 vUvs;

    void main() {
      vCol = aICol;

      vec2 adjVec = vec2(${adjX}, ${adjY});
      vec3 adjPos = vec3(aVPos + adjVec + aIPos, 1.0);

      gl_Position = vec4(
        (projectionMatrix * translationMatrix * adjPos).xy,
        0.0, 1.0
      );

      vUvs = aIUv;
    }
    `,

    `
    precision mediump float;

    varying vec3 vCol;
    varying vec2 vUvs;

    uniform float columns;
    uniform float rows;
    uniform float worldColumns;
    uniform float worldRows;
    uniform sampler2D elevationTex;
    uniform sampler2D animalKindTex;
    uniform float topLeftWorldColumn;
    uniform float topLeftWorldRow;

    void main() {
      // Convert vUvs to world coordinates.
      float worldX = topLeftWorldColumn + vUvs.x;
      float worldY = topLeftWorldRow + vUvs.y;

      // Convert world coordinates to texture coordinates.
      float textureX = worldX / worldColumns;
      float textureY = worldY / worldRows;
      float adjX = 1.0 / (worldColumns * 2.0);
      float adjY = 1.0 / (worldRows * 2.0);

      float texX = textureX + adjX;
      float texY = textureY + adjY;

      float elevation = texture2D(elevationTex, vec2(texX, texY)).r;
      float animalKind = texture2D(animalKindTex, vec2(texX, texY)).r;
      if (animalKind > 0.0) {
        // color red
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
      } else if (elevation < 0.5) {
        // color blue, lower elevation is darker blue.
        float xxx = elevation * 1000.0;
        float hundreds = floor(xxx / 100.0);
        float rem = xxx - (hundreds * 100.0);
        float blue = 0.3 + (rem / 100.0) * 0.5;
        gl_FragColor = vec4(0.1, 0.1, blue, 1.0);
      } else {
        float level = (elevation - 0.5) * 2.0;
        float xxx = level * 1000.0;
        float hundreds = floor(xxx / 100.0);
        float rem = xxx - (hundreds * 100.0);
        level = 0.25 + (rem / 100.0) * 0.5;
        gl_FragColor = vec4(level, level * 0.75, level * 0.75, 1.0);
      }
    }
    `,

    uniforms
  );

  return shader;
}
