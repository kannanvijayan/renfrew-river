import * as PIXI from "pixi.js";

export default class HexMesh {
  public readonly screenSize: [number, number];
  public readonly mapDataTexture: PIXI.Texture;
  public readonly mesh: PIXI.Mesh<PIXI.Shader>;

  public constructor(opts: {
    screenSize: [number, number],
  }) {
    this.screenSize = opts.screenSize;
    this.mapDataTexture = makeTexture();
    const geometry = makeGeometry();
    const shader = makeShader(this.screenSize, this.mapDataTexture);
    const mesh = new PIXI.Mesh(geometry, shader);
    this.mesh = mesh;
  }

  public updateSize(width: number, height: number): void {
    this.screenSize[0] = width;
    this.screenSize[1] = height;
    this.mesh.shader.uniforms.uScreenSize = [width, height];
  }
}

function makeTexture(): PIXI.Texture {
  // Make an array-buffer texture.
  const textureData = new Float32Array(1024 * 1024 * 4);
  for (let i = 0; i < (1024 * 1024); i++) {
    textureData[i * 4 + 0] = Math.random();
    textureData[i * 4 + 1] = Math.random();
    textureData[i * 4 + 2] = Math.random();
    textureData[i * 4 + 3] = 1.0;
  }
  return PIXI.Texture.fromBuffer(textureData, 1024, 1024, {
    format: PIXI.FORMATS.RGBA,
    type: PIXI.TYPES.FLOAT,
    scaleMode: PIXI.SCALE_MODES.NEAREST,
  });
}

function makeGeometry(): PIXI.Geometry {
  const TOP_LEFT = [-1, 1];
  const TOP_RIGHT = [1, 1];
  const BOTTOM_LEFT = [-1, -1];
  const BOTTOM_RIGHT = [1, -1];

  const geometry = new PIXI.Geometry();
  geometry.addAttribute("aPosition", [
    ...TOP_LEFT, ...TOP_RIGHT, ...BOTTOM_RIGHT,
    ...TOP_LEFT, ...BOTTOM_LEFT, ... BOTTOM_RIGHT,
  ]);

  return geometry;
}

function makeShader(screenSize: [number, number], texMapData: PIXI.Texture)
  : PIXI.Shader
{
  console.log("Setting screen size", screenSize);
  return PIXI.Shader.from(VERTEX_SHADER, FRAGMENT_SHADER, {
    uScreenSize: screenSize,
    uMapCellWidth: 20,
    texMapData,
  });
}

const VERTEX_SHADER = `
  attribute vec2 aPosition;

  uniform mat3 uProjectionMatrix;
  uniform mat3 uWorldTransformMatrix;
  uniform mat3 uTransformMatrix;

  varying vec2 vPos;
  void main() {
    vec2 leftAligned = aPosition + vec2(1.0, 0.0);
    vec2 axisFlipped = vec2(leftAligned.x, -leftAligned.y);
    vec2 topAligned = axisFlipped + vec2(0.0, 1.0);
    vec2 unitScaled = topAligned * 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
    vPos = unitScaled;
  }
`;

const HEXGRID_LIB = `
  const vec2 cNormalScaleCell = vec2(200.0, 200.0);
  const vec2 cNormalScaleMul = vec2(150.0, 200.0);

  float fmod(float a, float b) {
    return a - b * floor(a / b);
  }

  float fround(float a) {
    return floor(a + 0.5);
  }

  vec2 hexCellUnderNormalOffset(vec2 normalOffset) {
    float bbCol = floor(normalOffset.x / cNormalScaleMul.x);
    float oddColumn = fmod(bbCol, 2.0);
    float columnShift = oddColumn * (cNormalScaleCell.y / 2.0);
    float bbRow = floor((normalOffset.y - columnShift) / cNormalScaleMul.y);
    vec2 bb = vec2(bbCol, bbRow);

    vec2 offset = (
       normalOffset
         - (bb * cNormalScaleMul)
         - vec2(0.0, columnShift + (cNormalScaleCell.y / 2.0))
    );

    float slope = cNormalScaleCell.x / (2.0 * cNormalScaleCell.y);
    float ratio = offset.x / offset.y;
    if (offset.y < 0.0) {
      // Top half.
      if (ratio >= -slope) {
        bb = bb - vec2(1.0, 1.0 - oddColumn);
      }
    }
    if (offset.y > 0.0) {
      // Bottom half.
      if (ratio <= slope) {
        bb = bb + vec2(-1.0, oddColumn);
      }
    }

    return bb;
  }
`;

const FRAGMENT_SHADER = `
  ${HEXGRID_LIB}

  uniform vec2 uScreenSize;
  uniform float uMapCellWidth;

  uniform sampler2D texMapData;

  varying vec2 vPos;

  void main() {
    vec2 normPos = (vPos  / uMapCellWidth) * uScreenSize + vec2(0.72, 0.98);
    normPos = normPos * cNormalScaleMul;
    vec2 hexCell = hexCellUnderNormalOffset(normPos);
    vec2 texCoord = (hexCell + vec2(0.5, 0.5));
    vec4 color2 = texture2D(texMapData, texCoord / 1024.0);

    vec4 color3 = vec4(color2.xyz, 1.0);
    if (hexCell.y < 0.0 || hexCell.x < 0.0) {
      color3 = vec4(1.0, 1.0, 1.0, 1.0);
    }
    gl_FragColor = color3;
  }
`;
