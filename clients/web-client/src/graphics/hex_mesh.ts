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
    const row = Math.floor(i / 1024);
    if (true) {
      switch (i % 3) {
        case 0:
          textureData[i * 4 + 0] = 1.0;
          textureData[i * 4 + 1] = 0.0;
          textureData[i * 4 + 2] = 0.0;
          textureData[i * 4 + 3] = 1.0;
          break;
        case 1:
          textureData[i * 4 + 0] = 0.0;
          textureData[i * 4 + 1] = 1.0;
          textureData[i * 4 + 2] = 0.0;
          textureData[i * 4 + 3] = 1.0;
          break;
        case 2:
          textureData[i * 4 + 0] = 0.0;
          textureData[i * 4 + 1] = 0.0;
          textureData[i * 4 + 2] = 1.0;
          textureData[i * 4 + 3] = 1.0;
          break;
      }
    }
  }
  return PIXI.Texture.fromBuffer(textureData, 1024, 1024, {
    format: PIXI.FORMATS.RGBA,
    type: PIXI.TYPES.FLOAT,
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
    uMapCellWidth: 300,
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
  const vec2 cNormalScaleCell = vec2(1.0, 1.0);
  const vec2 cNormalScaleMul = vec2(0.75, 1.0);

  const float cEpsilon = 0.00001;
  float isZero(float x) {
    if (abs(x) < cEpsilon) {
      return 1.0;
    } else {
      return 0.0;
    }
  }

  float fmod(float a, float b) {
    return a - b * floor(a / b);
  }

  vec2 hexCellUnderNormalOffset(vec2 normalOffset) {
    float bbCol = floor(normalOffset.x / cNormalScaleMul.x);
    float oddColumn = floor(fmod(bbCol, 2.0));
    float columnShift = oddColumn * (cNormalScaleCell.y / 2.0);
    float bbRow = floor((normalOffset.y - columnShift) / cNormalScaleMul.y);
    vec2 bb = vec2(bbCol, bbRow);

    vec2 offset = (
       normalOffset
         - (bb * cNormalScaleMul)
         - vec2(0.0, columnShift + (cNormalScaleCell.y / 2.0))
    );

    float slope = (cNormalScaleCell.x / 4.0) / (cNormalScaleCell.y / 2.0);
    float ratio = offset.x / offset.y;

    if (offset.y < 0.0) {
      // Top half.
      if (ratio >= -slope) {
        bb = bb - vec2(1.0, 1.0 - oddColumn);
      }
    } else {
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
    vec2 normPos = (vPos * uScreenSize) / uMapCellWidth;
    vec2 hexCell = hexCellUnderNormalOffset(normPos);
    vec2 texCoord = (hexCell + vec2(0.5, 0.5));
    vec4 color2 = texture2D(texMapData, texCoord / 1024.0);

    vec4 color3 = vec4(color2.xyz, 1.0);
    if (hexCell.y < 0.0 || hexCell.x < 0.0) {
      color3 = vec4(1.0, 1.0, 1.0, 1.0);
    }

    if (vPos.x > 0.5) {
      if (hexCell.y < 0.0) {
        color3 = vec4(1.0, 1.0, 1.0, 1.0);
      } else if (hexCell.y < 1.0) {
        color3 = vec4(0.0, 0.5, 0.9, 1.0);
      } else {
        color3 = texture2D(texMapData, vec2(0.5, 0.5) / 1024.0);
      }
    }
    if (vPos.x > 0.75) {
      if (texCoord.y > 1024.0) {
        color3 = vec4(1.0, 0.0, 1.0, 1.0);
      } else if (texCoord.y > 1023.0) {
        color3 = vec4(0.0, 0.9, 0.6, 1.0);
      }

      if ((texCoord.y < 1000.0) && (texCoord.y > 999.0)) {
        color3 = texture2D(texMapData,
          vec2(texCoord.x, 1023.5) / 1024.0);
      }
    } 
    gl_FragColor = color3;

    /*
    float xf = fmod(pos.x, 100.0);
    float yf = fmod(pos.y, 100.0);
    float bchan = 0.0;
    if (xf < yf) {
      bchan = 1.0;
    }
    if (pos.x < pos.y) {
      gl_FragColor = vec4(1.0, 0.0, bchan, 1.0);
    } else {
      gl_FragColor = vec4(0.0, 1.0, bchan, 1.0);
    }
    
    float dx = pos.x - 100.0;
    float dy = pos.y - 100.0;
    float dist = sqrt(dx * dx + dy * dy);
    if (dist < 50.0) {
      vec4 color = texture2D(texMapData, (vec2(dx + 50.0, dy + 50.0) / 1000.0));
      gl_FragColor = color;
    }

    if (uScreenSize.y - pos.y < 50.0) {
      gl_FragColor = vec4(0.8, 0.7, 0.3, 1.0);
    }
    */
  }
`;
