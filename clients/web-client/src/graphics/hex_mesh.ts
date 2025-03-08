import * as PIXI from "pixi.js";

export default class HexMesh {
  public readonly screenSize: [number, number];
  public readonly mesh: PIXI.Mesh<PIXI.Geometry, PIXI.Shader>;

  public constructor(opts: {
    screenSize: [number, number],
  }) {
    this.screenSize = opts.screenSize;
    const geometry = makeGeometry();
    const shader = makeShader(this.screenSize);
    this.mesh = new PIXI.Mesh({geometry, shader});
  }
}

function makeGeometry(): PIXI.Geometry {
  const TOP_LEFT = [-1, 1];
  const TOP_RIGHT = [1, 1];
  const BOTTOM_LEFT = [-1, -1];
  const BOTTOM_RIGHT = [1, -1];

  return new PIXI.Geometry({
    attributes: {
      aPosition: [
        ...TOP_LEFT, ...TOP_RIGHT, ...BOTTOM_RIGHT,
        ...TOP_LEFT, ...BOTTOM_LEFT, ... BOTTOM_RIGHT,
      ],
    },
  });
}

function makeShader(screenSize: [number, number]): PIXI.Shader {
  console.log("Setting screen size", screenSize);
  return PIXI.Shader.from({
    gl: {
      vertex: VERTEX_SHADER,
      fragment: FRAGMENT_SHADER,
    },
    resources: {
      shaderUniforms: {
        uScreenWidth: { value: screenSize[0], type: "f32" },
        uScreenHeight: { value: screenSize[1], type: "f32" },
      },
    }
  });
}

const VERTEX_SHADER = `
  in vec2 aPosition;

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
  uniform float uScreenWidth;
  uniform float uScreenHeight;

  varying vec2 vPos;

  float fmod(float a, float b) {
    return a - b * floor(a / b);
  }

  void main() {
    vec2 pos = vPos * vec2(uScreenWidth, uScreenHeight);

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
      gl_FragColor = vec4(1.0, 1.0, 0.0, 1.0);
    }

    if (uScreenHeight - pos.y < 50.0) {
      gl_FragColor = vec4(0.8, 0.7, 0.3, 1.0);
    }
  }
`;
