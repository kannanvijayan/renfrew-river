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
  for (let i = 0; i < textureData.length; i++) {
    if (i % 4 != 3) {
      textureData[i] = Math.random();
    } else {
      textureData[i] = 1;
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
    vec2 screenPos = unitScaled;
    gl_Position = vec4(aPosition, 0.0, 1.0);
    vPos = screenPos;
  }
`;

const FRAGMENT_SHADER = `
  uniform vec2 uScreenSize;

  uniform sampler2D texMapData;

  varying vec2 vPos;

  float fmod(float a, float b) {
    return a - b * floor(a / b);
  }

  void main() {
    vec2 pos = vPos * uScreenSize;

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
      vec4 color = texture2D(texMapData, vec2(dx + 50.0, dy + 50.0) / 1000.0);
      gl_FragColor = color;
    }

    if (uScreenSize.y - pos.y < 50.0) {
      gl_FragColor = vec4(0.8, 0.7, 0.3, 1.0);
    }
  }
`;
