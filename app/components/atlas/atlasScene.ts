export type AtlasMode = "world" | "china";

export type AtlasWork = {
  id: string;
  name: string;
  type: string;
  genre: string | null;
  bookKey: string;
  unit: string | null;
  /**
   * 该实体**首次被提及**的 PDF 页（firstPage，向后兼容字段，仍叫 page）。
   * 注意语义：可能是作曲家介绍页、别的作品的「相关作品」引用页，不一定作品正文/谱例所在页，
   * 所以不能拿它当「教材第 N 页」对应的 PDF 页用。
   */
  page: number | null;
  /** 印刷页（教材第 N 页）：来自正式 media 标题或正式 evidence 的教材页；无法确定为 null。 */
  printedPage?: number | null;
  /** 上面这个印刷页对应的 PDF 页（同一份正式 evidence 里的 pdfPage）；取不到为 null。 */
  printedPdfPage?: number | null;
  /** 印刷页来源："media"（media 标题）/ "evidence"（正式证据的教材页）/ null（拿不到）。 */
  printedPageSource?: "media" | "evidence" | null;
};

export type AtlasRegion = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  mode: AtlasMode;
  works: AtlasWork[];
};

export type AtlasTerrain = {
  cols: number;
  rows: number;
  lon0: number;
  lat1: number;
  step: number;
  vmin: number;
  vmax: number;
};

type Uniforms = Record<string, WebGLUniformLocation | null>;
type Program = { value: WebGLProgram; uniforms: Uniforms };
type ProjectedMarker = {
  region: AtlasRegion;
  topX: number;
  topY: number;
  baseX: number;
  baseY: number;
  depth: number;
  count: number;
};
type Point3 = [number, number, number];
type Point4 = [number, number, number, number];
type SceneCallbacks = {
  onSelect: (regionId: string) => void;
  onHover: (region: AtlasRegion | null, x: number, y: number) => void;
  onContextLost: () => void;
};

const GLOBE_DISTANCE = 4.7;
const HEIGHT_UNITS_PER_METRE = 0.00002;
const radians = Math.PI / 180;
const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const Mat4 = {
  multiply(a: Float32Array, b: Float32Array) {
    const output = new Float32Array(16);
    for (let column = 0; column < 4; column += 1) {
      for (let row = 0; row < 4; row += 1) {
        let sum = 0;
        for (let index = 0; index < 4; index += 1) {
          sum += a[index * 4 + row] * b[column * 4 + index];
        }
        output[column * 4 + row] = sum;
      }
    }
    return output;
  },
  perspective(fieldOfView: number, aspect: number, near: number, far: number) {
    const scale = 1 / Math.tan(fieldOfView / 2);
    const output = new Float32Array(16);
    output[0] = scale / aspect;
    output[5] = scale;
    output[10] = (far + near) / (near - far);
    output[11] = -1;
    output[14] = (2 * far * near) / (near - far);
    return output;
  },
  translate(x: number, y: number, z: number) {
    return new Float32Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      x, y, z, 1,
    ]);
  },
  rotateY(angle: number) {
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);
    return new Float32Array([
      cosine, 0, -sine, 0,
      0, 1, 0, 0,
      sine, 0, cosine, 0,
      0, 0, 0, 1,
    ]);
  },
  rotateX(angle: number) {
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);
    return new Float32Array([
      1, 0, 0, 0,
      0, cosine, sine, 0,
      0, -sine, cosine, 0,
      0, 0, 0, 1,
    ]);
  },
  apply(matrix: Float32Array, point: Point3): Point4 {
    const [x, y, z] = point;
    return [
      matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12],
      matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13],
      matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14],
      matrix[3] * x + matrix[7] * y + matrix[11] * z + matrix[15],
    ];
  },
};

function vectorLength(value: Point3) {
  return Math.hypot(value[0], value[1], value[2]) || 1;
}

function normalize(value: Point3): Point3 {
  const length = vectorLength(value);
  return [value[0] / length, value[1] / length, value[2] / length];
}

function cross(left: Point3, right: Point3): Point3 {
  return [
    left[1] * right[2] - left[2] * right[1],
    left[2] * right[0] - left[0] * right[2],
    left[0] * right[1] - left[1] * right[0],
  ];
}

function dot(left: Point3, right: Point3) {
  return left[0] * right[0] + left[1] * right[1] + left[2] * right[2];
}

function lookAt(eye: Point3, center: Point3) {
  const zAxis = normalize([eye[0] - center[0], eye[1] - center[1], eye[2] - center[2]]);
  const xAxis = normalize(cross([0, 1, 0], zAxis));
  const yAxis = cross(zAxis, xAxis);
  return new Float32Array([
    xAxis[0], yAxis[0], zAxis[0], 0,
    xAxis[1], yAxis[1], zAxis[1], 0,
    xAxis[2], yAxis[2], zAxis[2], 0,
    -dot(xAxis, eye), -dot(yAxis, eye), -dot(zAxis, eye), 1,
  ]);
}

function lambertConformalConic(longitude: number, latitude: number): [number, number] {
  const parallel1 = 25 * radians;
  const parallel2 = 47 * radians;
  const centerLatitude = 35 * radians;
  const centerLongitude = 105 * radians;
  const cone =
    Math.log(Math.cos(parallel1) / Math.cos(parallel2)) /
    Math.log(
      Math.tan(Math.PI / 4 + parallel2 / 2) /
        Math.tan(Math.PI / 4 + parallel1 / 2),
    );
  const factor =
    (Math.cos(parallel1) * Math.tan(Math.PI / 4 + parallel1 / 2) ** cone) /
    cone;
  const rho = (value: number) =>
    (6371 * factor) / Math.tan(Math.PI / 4 + value / 2) ** cone;
  const centerRho = rho(centerLatitude);
  const pointRho = rho(latitude * radians);
  const theta = cone * (longitude * radians - centerLongitude);
  return [
    (pointRho * Math.sin(theta)) / 50,
    -((centerRho - pointRho * Math.cos(theta)) / 50),
  ];
}

const GLOBE_VERTEX_SHADER = `#version 300 es
layout(location=0) in vec3 aPos; layout(location=1) in vec2 aUv;
uniform mat4 uMVP; uniform mat3 uRot; out vec2 vUv; out vec3 vN;
void main(){ vUv=aUv; vN=uRot*aPos; gl_Position=uMVP*vec4(aPos,1.0); }`;

const GLOBE_FRAGMENT_SHADER = `#version 300 es
precision highp float; uniform sampler2D uTex, uMask; uniform vec3 uL; in vec2 vUv; in vec3 vN; out vec4 o;
void main(){
  vec3 N=normalize(vN); vec3 c=texture(uTex,vUv).rgb; float land=texture(uMask,vUv).r;
  float ndl=dot(N,uL); float diff=clamp(ndl*0.5+0.5,0.0,1.0); diff=diff*diff*1.15+0.13;
  vec3 col=c*diff;
  vec3 H=normalize(uL+vec3(0.,0.,1.)); float sp=pow(max(dot(N,H),0.),90.0)*(1.0-land); col+=sp*vec3(.85,.95,1.0)*0.75;
  col=mix(col*vec3(.55,.68,1.0),col,smoothstep(-.25,.4,ndl));
  float rim=pow(1.0-max(N.z,0.0),2.4); col+=vec3(.20,.50,.90)*rim*(0.35+0.65*smoothstep(-.4,.5,ndl));
  o=vec4(col,1.0); }`;

const ATMOSPHERE_FRAGMENT_SHADER = `#version 300 es
precision highp float; in vec3 vN; uniform vec3 uL; out vec4 o;
void main(){ vec3 N=normalize(vN); float d=abs(N.z); float I=pow(clamp(1.0-d,0.,1.),1.6)*pow(clamp(d*3.2,0.,1.),1.4); float lit=0.35+0.65*smoothstep(-.7,.5,dot(vec3(N.x,N.y,abs(N.z)),uL)); o=vec4(vec3(.22,.5,.95)*I*lit*.9,I*.6); }`;

const ATMOSPHERE_VERTEX_SHADER = `#version 300 es
layout(location=0) in vec3 aPos; uniform mat4 uMVP; uniform mat3 uRot; out vec3 vN;
void main(){ vN=uRot*aPos; gl_Position=uMVP*vec4(aPos,1.0); }`;

const TERRAIN_VERTEX_SHADER = `#version 300 es
layout(location=0) in vec2 aIJ; layout(location=1) in vec2 aXZ; layout(location=2) in vec2 aCell;
uniform sampler2D uH; uniform mat4 uVP; uniform float uYK; uniform vec2 uGrid;
out float vE; out vec3 vN; out vec3 vW; out float vFade;
float h(ivec2 p){ p=clamp(p,ivec2(0),ivec2(uGrid)-1); return max(texelFetch(uH,p,0).r,0.0); }
void main(){
  ivec2 p=ivec2(aIJ); float e=texelFetch(uH,p,0).r; float he=max(e,0.0);
  float edge=min(min(aIJ.x,uGrid.x-1.0-aIJ.x),min(aIJ.y,uGrid.y-1.0-aIJ.y)); float fade=smoothstep(0.0,26.0,edge);
  float y=he*uYK*fade;
  float dx=(h(p+ivec2(1,0))-h(p+ivec2(-1,0)))*uYK/(2.0*aCell.x); float dz=(h(p+ivec2(0,1))-h(p+ivec2(0,-1)))*uYK/(2.0*aCell.y);
  vN=normalize(vec3(-dx,1.0,-dz)); vE=e; vFade=fade; vW=vec3(aXZ.x,y,aXZ.y); gl_Position=uVP*vec4(vW,1.0); }`;

const TERRAIN_FRAGMENT_SHADER = `#version 300 es
precision highp float; in float vE; in vec3 vN; in vec3 vW; in float vFade; uniform vec3 uCam; uniform vec3 uBg; uniform float uContour; out vec4 o;
vec3 ramp(float e){
  vec3 c0=vec3(.35,.45,.28), c1=vec3(.44,.54,.32), c2=vec3(.60,.64,.40), c3=vec3(.70,.60,.39), c4=vec3(.63,.50,.34), c5=vec3(.53,.41,.31), c6=vec3(.73,.66,.60), c7=vec3(.93,.90,.85);
  vec3 c=c0; c=mix(c,c1,smoothstep(0.,250.,e)); c=mix(c,c2,smoothstep(250.,800.,e)); c=mix(c,c3,smoothstep(800.,1500.,e)); c=mix(c,c4,smoothstep(1500.,2500.,e)); c=mix(c,c5,smoothstep(2500.,3800.,e)); c=mix(c,c6,smoothstep(3800.,5000.,e)); c=mix(c,c7,smoothstep(5000.,6300.,e)); return c; }
void main(){
  vec3 N=normalize(vN); vec3 L=normalize(vec3(-.62,.55,-.5)); float d=max(dot(N,L),0.0);
  vec3 col;
  if(vE<=0.5){ float t=smoothstep(-420.,0.,vE); col=mix(vec3(.05,.20,.28),vec3(.14,.42,.50),t); vec3 V=normalize(uCam-vW); vec3 H=normalize(L+V); col+=pow(max(dot(vec3(0.,1.,0.),H),0.),80.)*vec3(.7,.85,.9)*.35; }
  else { vec3 b=ramp(vE); col=b*(0.30+1.05*d); col*=mix(1.0,0.86,smoothstep(.55,1.0,1.0-N.y)); }
  if(uContour>0.5 && vE>0.5){ float ev=vE/500.0; float w=fwidth(ev); float l=1.0-clamp(abs(fract(ev-0.5)-0.5)/max(w,1e-4),0.,1.); col=mix(col,col*.55,l*.32*uContour); }
  float dist=length(uCam-vW); float fog=smoothstep(60.,330.,dist); col=mix(col,uBg,fog*.55);
  col=mix(uBg,col,vFade); o=vec4(col,1.0); }`;

export class AtlasScene {
  private readonly gl: WebGL2RenderingContext;
  private readonly contextLost = (event: Event) => {
    event.preventDefault();
    this.callbacks.onContextLost();
  };
  private readonly callbacks: SceneCallbacks;
  private readonly canvas: HTMLCanvasElement;
  private readonly overlay: HTMLCanvasElement;
  private readonly stage: HTMLElement;
  private readonly terrain: AtlasTerrain;
  private readonly elevations: Float32Array;
  private readonly textures: { relief: HTMLImageElement; mask: HTMLImageElement };
  private readonly regions: AtlasRegion[];
  private readonly reducedMotion: boolean;
  private readonly resizeObserver: ResizeObserver;
  private readonly intersectionObserver: IntersectionObserver;
  private readonly visibilityChange = () => this.invalidate();
  private readonly pointerDown = (event: PointerEvent) => this.onPointerDown(event);
  private readonly pointerMove = (event: PointerEvent) => this.onPointerMove(event);
  private readonly pointerUp = (event: PointerEvent) => this.onPointerUp(event);
  private readonly pointerLeave = () => this.onPointerLeave();
  private readonly wheel = (event: WheelEvent) => this.onWheel(event);
  private readonly glPrograms: Program[] = [];
  private readonly buffers: WebGLBuffer[] = [];
  private readonly vertexArrays: WebGLVertexArrayObject[] = [];
  private readonly texturesOwned: WebGLTexture[] = [];
  private readonly markerById = new Map<string, AtlasRegion>();
  private globeProgram!: Program;
  private atmosphereProgram!: Program;
  private terrainProgram!: Program;
  private globeVao!: WebGLVertexArrayObject;
  private terrainVao!: WebGLVertexArrayObject;
  private globeCount = 0;
  private terrainCount = 0;
  private reliefTexture!: WebGLTexture;
  private maskTexture!: WebGLTexture;
  private elevationTexture!: WebGLTexture;
  private width = 1;
  private height = 1;
  private dpr = 1;
  private mode: AtlasMode = "world";
  private filterKey = "全部";
  private selectedId: string | null = null;
  private hoveredId: string | null = null;
  private exaggeration = 14;
  private contours = false;
  private dirty = true;
  private raf = 0;
  private visible = false;
  private disposed = false;
  private lastPointer: [number, number] | null = null;
  private pointerMoved = 0;
  private lastTouch = 0;
  private markerHits: ProjectedMarker[] = [];
  private globe = { yaw: 1, pitch: 0.5, targetYaw: null as number | null, targetPitch: null as number | null };
  private camera = { yaw: 0, pitch: 0.92, distance: 150, centerX: 0, centerZ: 0, target: null as [number, number, number] | null };

  constructor(options: {
    canvas: HTMLCanvasElement;
    overlay: HTMLCanvasElement;
    stage: HTMLElement;
    terrain: AtlasTerrain;
    elevations: Float32Array;
    textures: { relief: HTMLImageElement; mask: HTMLImageElement };
    regions: AtlasRegion[];
    reducedMotion: boolean;
    callbacks: SceneCallbacks;
  }) {
    this.canvas = options.canvas;
    this.overlay = options.overlay;
    this.stage = options.stage;
    this.terrain = options.terrain;
    this.elevations = options.elevations;
    this.textures = options.textures;
    this.regions = options.regions;
    this.reducedMotion = options.reducedMotion;
    this.callbacks = options.callbacks;
    const gl = this.canvas.getContext("webgl2", {
      antialias: true,
      alpha: true,
      premultipliedAlpha: true,
      powerPreference: "high-performance",
    });
    if (!gl) throw new Error("WebGL2 unavailable");
    this.gl = gl;
    this.regions.forEach((region) => this.markerById.set(region.id, region));
    this.initializePrograms();
    this.initializeGlobeMesh();
    this.initializeTerrainMesh();
    this.initializeTextures();
    this.stage.addEventListener("pointerdown", this.pointerDown);
    this.stage.addEventListener("pointermove", this.pointerMove);
    this.stage.addEventListener("pointerup", this.pointerUp);
    this.stage.addEventListener("pointercancel", this.pointerUp);
    this.stage.addEventListener("pointerleave", this.pointerLeave);
    this.stage.addEventListener("wheel", this.wheel, { passive: false });
    this.canvas.addEventListener("webglcontextlost", this.contextLost);
    document.addEventListener("visibilitychange", this.visibilityChange);
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.stage);
    this.intersectionObserver = new IntersectionObserver((entries) => {
      this.visible = Boolean(entries[0]?.isIntersecting);
      if (this.visible) this.invalidate();
      else this.cancelFrame();
    });
    this.intersectionObserver.observe(this.stage);
    this.resize();
  }

  setMode(mode: AtlasMode) {
    if (this.mode === mode) return;
    this.mode = mode;
    this.selectedId = null;
    this.hoveredId = null;
    if (mode === "china") {
      this.camera = { yaw: 0, pitch: 0.92, distance: 150, centerX: 0, centerZ: 0, target: null };
    }
    this.invalidate();
  }

  setFilter(filterKey: string) {
    if (this.filterKey === filterKey) return;
    this.filterKey = filterKey;
    this.invalidate();
  }

  setSelection(regionId: string | null) {
    this.selectedId = regionId;
    if (regionId) {
      const region = this.markerById.get(regionId);
      if (region?.mode === "world") {
        this.globe.targetYaw = region.lon * radians;
        this.globe.targetPitch = clamp(region.lat * radians * 0.75, -0.7, 0.9);
        if (this.reducedMotion) {
          this.globe.yaw = this.globe.targetYaw;
          this.globe.pitch = this.globe.targetPitch;
          this.globe.targetYaw = null;
          this.globe.targetPitch = null;
        }
      } else if (region) {
        const [x, z] = lambertConformalConic(region.lon, region.lat);
        this.camera.target = [x, z, 95];
        if (this.reducedMotion) this.applyCameraTarget();
      }
    }
    this.invalidate();
  }

  setHover(regionId: string | null) {
    if (this.hoveredId === regionId) return;
    this.hoveredId = regionId;
    this.invalidate();
  }

  setExaggeration(value: number) {
    this.exaggeration = clamp(value, 4, 30);
    this.invalidate();
  }

  setContours(value: boolean) {
    this.contours = value;
    this.invalidate();
  }

  frameRegions(regions: AtlasRegion[]) {
    if (!regions.length) return;
    if (this.mode === "world") {
      const meanSin = regions.reduce((sum, region) => sum + Math.sin(region.lon * radians), 0);
      const meanCos = regions.reduce((sum, region) => sum + Math.cos(region.lon * radians), 0);
      const latitude = regions.reduce((sum, region) => sum + region.lat, 0) / regions.length;
      this.globe.targetYaw = Math.atan2(meanSin, meanCos);
      this.globe.targetPitch = clamp(latitude * radians * 0.75, -0.7, 0.9);
    } else {
      const projected = regions.map((region) => lambertConformalConic(region.lon, region.lat));
      const minX = Math.min(...projected.map((point) => point[0]));
      const maxX = Math.max(...projected.map((point) => point[0]));
      const minZ = Math.min(...projected.map((point) => point[1]));
      const maxZ = Math.max(...projected.map((point) => point[1]));
      this.camera.target = [
        (minX + maxX) / 2,
        (minZ + maxZ) / 2,
        clamp(Math.max(maxX - minX, maxZ - minZ) * 2.4 + 58, 70, 210),
      ];
      if (this.reducedMotion) this.applyCameraTarget();
    }
    this.invalidate();
  }

  elevationAt(longitude: number, latitude: number) {
    const x = clamp((longitude - this.terrain.lon0) / this.terrain.step, 0, this.terrain.cols - 1.001);
    const y = clamp((this.terrain.lat1 - latitude) / this.terrain.step, 0, this.terrain.rows - 1.001);
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const fx = x - x0;
    const fy = y - y0;
    const at = (column: number, row: number) => this.elevations[row * this.terrain.cols + column];
    return (
      (at(x0, y0) * (1 - fx) + at(x0 + 1, y0) * fx) * (1 - fy) +
      (at(x0, y0 + 1) * (1 - fx) + at(x0 + 1, y0 + 1) * fx) * fy
    );
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.cancelFrame();
    this.resizeObserver.disconnect();
    this.intersectionObserver.disconnect();
    document.removeEventListener("visibilitychange", this.visibilityChange);
    this.stage.removeEventListener("pointerdown", this.pointerDown);
    this.stage.removeEventListener("pointermove", this.pointerMove);
    this.stage.removeEventListener("pointerup", this.pointerUp);
    this.stage.removeEventListener("pointercancel", this.pointerUp);
    this.stage.removeEventListener("pointerleave", this.pointerLeave);
    this.stage.removeEventListener("wheel", this.wheel);
    this.canvas.removeEventListener("webglcontextlost", this.contextLost);
    this.vertexArrays.forEach((vertexArray) => this.gl.deleteVertexArray(vertexArray));
    this.buffers.forEach((buffer) => this.gl.deleteBuffer(buffer));
    this.texturesOwned.forEach((texture) => this.gl.deleteTexture(texture));
    this.glPrograms.forEach((program) => this.gl.deleteProgram(program.value));
    this.gl.getExtension("WEBGL_lose_context")?.loseContext();
  }

  private initializePrograms() {
    this.globeProgram = this.createProgram(GLOBE_VERTEX_SHADER, GLOBE_FRAGMENT_SHADER);
    this.atmosphereProgram = this.createProgram(ATMOSPHERE_VERTEX_SHADER, ATMOSPHERE_FRAGMENT_SHADER);
    this.terrainProgram = this.createProgram(TERRAIN_VERTEX_SHADER, TERRAIN_FRAGMENT_SHADER);
  }

  private createProgram(vertexSource: string, fragmentSource: string): Program {
    const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, fragmentSource);
    const program = this.gl.createProgram();
    if (!program) throw new Error("WebGL program could not be allocated");
    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);
    this.gl.deleteShader(vertexShader);
    this.gl.deleteShader(fragmentShader);
    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      throw new Error(this.gl.getProgramInfoLog(program) || "WebGL program failed to link");
    }
    const uniforms: Uniforms = {};
    const uniformCount = this.gl.getProgramParameter(program, this.gl.ACTIVE_UNIFORMS) as number;
    for (let index = 0; index < uniformCount; index += 1) {
      const uniform = this.gl.getActiveUniform(program, index);
      if (uniform) uniforms[uniform.name] = this.gl.getUniformLocation(program, uniform.name);
    }
    const result = { value: program, uniforms };
    this.glPrograms.push(result);
    return result;
  }

  private compileShader(kind: number, source: string) {
    const shader = this.gl.createShader(kind);
    if (!shader) throw new Error("WebGL shader could not be allocated");
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      const message = this.gl.getShaderInfoLog(shader) || "WebGL shader failed to compile";
      this.gl.deleteShader(shader);
      throw new Error(message);
    }
    return shader;
  }

  private makeBuffer(target: number, data: BufferSource) {
    const buffer = this.gl.createBuffer();
    if (!buffer) throw new Error("WebGL buffer could not be allocated");
    this.gl.bindBuffer(target, buffer);
    this.gl.bufferData(target, data, this.gl.STATIC_DRAW);
    this.buffers.push(buffer);
    return buffer;
  }

  private initializeGlobeMesh() {
    const latitudeSteps = 96;
    const longitudeSteps = 192;
    const vertices: number[] = [];
    const indices: number[] = [];
    for (let row = 0; row <= latitudeSteps; row += 1) {
      const latitude = Math.PI / 2 - (row * Math.PI) / latitudeSteps;
      for (let column = 0; column <= longitudeSteps; column += 1) {
        const longitude = -Math.PI + (column * Math.PI * 2) / longitudeSteps;
        vertices.push(
          Math.cos(latitude) * Math.sin(longitude),
          Math.sin(latitude),
          Math.cos(latitude) * Math.cos(longitude),
          column / longitudeSteps,
          row / latitudeSteps,
        );
      }
    }
    for (let row = 0; row < latitudeSteps; row += 1) {
      for (let column = 0; column < longitudeSteps; column += 1) {
        const a = row * (longitudeSteps + 1) + column;
        const b = a + longitudeSteps + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
    this.globeCount = indices.length;
    const vao = this.gl.createVertexArray();
    if (!vao) throw new Error("WebGL globe mesh could not be allocated");
    this.globeVao = vao;
    this.vertexArrays.push(vao);
    this.gl.bindVertexArray(vao);
    this.makeBuffer(this.gl.ARRAY_BUFFER, new Float32Array(vertices));
    this.gl.enableVertexAttribArray(0);
    this.gl.vertexAttribPointer(0, 3, this.gl.FLOAT, false, 20, 0);
    this.gl.enableVertexAttribArray(1);
    this.gl.vertexAttribPointer(1, 2, this.gl.FLOAT, false, 20, 12);
    this.makeBuffer(this.gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indices));
    this.gl.bindVertexArray(null);
  }

  private initializeTerrainMesh() {
    const stride = window.matchMedia("(max-width: 600px)").matches ? 2 : 1;
    const columns: number[] = [];
    const rows: number[] = [];
    for (let index = 0; index < this.terrain.cols; index += stride) columns.push(index);
    for (let index = 0; index < this.terrain.rows; index += stride) rows.push(index);
    if (columns.at(-1) !== this.terrain.cols - 1) columns.push(this.terrain.cols - 1);
    if (rows.at(-1) !== this.terrain.rows - 1) rows.push(this.terrain.rows - 1);
    const vertexCount = columns.length * rows.length;
    const ij = new Float32Array(vertexCount * 2);
    const xz = new Float32Array(vertexCount * 2);
    const cell = new Float32Array(vertexCount * 2);
    const metersPerGrid = this.terrain.step;
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
      for (let columnIndex = 0; columnIndex < columns.length; columnIndex += 1) {
        const sourceX = columns[columnIndex];
        const sourceY = rows[rowIndex];
        const index = rowIndex * columns.length + columnIndex;
        const longitude = this.terrain.lon0 + sourceX * metersPerGrid;
        const latitude = this.terrain.lat1 - sourceY * metersPerGrid;
        const projected = lambertConformalConic(longitude, latitude);
        ij[index * 2] = sourceX;
        ij[index * 2 + 1] = sourceY;
        xz[index * 2] = projected[0];
        xz[index * 2 + 1] = projected[1];
        const left = lambertConformalConic(longitude - metersPerGrid, latitude);
        const right = lambertConformalConic(longitude + metersPerGrid, latitude);
        const north = lambertConformalConic(longitude, latitude + metersPerGrid);
        const south = lambertConformalConic(longitude, latitude - metersPerGrid);
        cell[index * 2] = Math.hypot(right[0] - left[0], right[1] - left[1]) / 2;
        cell[index * 2 + 1] = Math.hypot(north[0] - south[0], north[1] - south[1]) / 2;
      }
    }
    const indices = new Uint32Array((columns.length - 1) * (rows.length - 1) * 6);
    let cursor = 0;
    for (let row = 0; row < rows.length - 1; row += 1) {
      for (let column = 0; column < columns.length - 1; column += 1) {
        const a = row * columns.length + column;
        const b = a + 1;
        const c = a + columns.length;
        const d = c + 1;
        indices.set([a, c, b, b, c, d], cursor);
        cursor += 6;
      }
    }
    this.terrainCount = indices.length;
    const vao = this.gl.createVertexArray();
    if (!vao) throw new Error("WebGL terrain mesh could not be allocated");
    this.terrainVao = vao;
    this.vertexArrays.push(vao);
    this.gl.bindVertexArray(vao);
    const bindAttribute = (values: Float32Array<ArrayBuffer>, location: number) => {
      this.makeBuffer(this.gl.ARRAY_BUFFER, values);
      this.gl.enableVertexAttribArray(location);
      this.gl.vertexAttribPointer(location, 2, this.gl.FLOAT, false, 0, 0);
    };
    bindAttribute(ij, 0);
    bindAttribute(xz, 1);
    bindAttribute(cell, 2);
    this.makeBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indices);
    this.gl.bindVertexArray(null);

    const heightTexture = this.gl.createTexture();
    if (!heightTexture) throw new Error("WebGL height texture could not be allocated");
    this.elevationTexture = heightTexture;
    this.texturesOwned.push(heightTexture);
    this.gl.bindTexture(this.gl.TEXTURE_2D, heightTexture);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.R32F,
      this.terrain.cols,
      this.terrain.rows,
      0,
      this.gl.RED,
      this.gl.FLOAT,
      this.elevations,
    );
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
  }

  private initializeTextures() {
    const createImageTexture = (image: HTMLImageElement) => {
      const texture = this.gl.createTexture();
      if (!texture) throw new Error("WebGL relief texture could not be allocated");
      this.texturesOwned.push(texture);
      this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
      // The sphere's v runs north -> south (row / latitudeSteps) and so does the image, so no Y flip.
      // (A flip here puts Antarctica at the north pole and Europe in the ocean.)
      this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, 0);
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);
      this.gl.generateMipmap(this.gl.TEXTURE_2D);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_LINEAR);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.REPEAT);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
      return texture;
    };
    this.reliefTexture = createImageTexture(this.textures.relief);
    this.maskTexture = createImageTexture(this.textures.mask);
  }

  private resize() {
    const rect = this.stage.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = Math.max(1, rect.width);
    this.height = Math.max(1, rect.height);
    const pixelWidth = Math.round(this.width * this.dpr);
    const pixelHeight = Math.round(this.height * this.dpr);
    for (const canvas of [this.canvas, this.overlay]) {
      if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
      if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
    }
    this.invalidate();
  }

  private invalidate() {
    this.dirty = true;
    if (this.raf || this.disposed || !this.visible || document.hidden) return;
    this.raf = window.requestAnimationFrame((time) => this.frame(time));
  }

  private cancelFrame() {
    if (!this.raf) return;
    window.cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private frame(time: number) {
    this.raf = 0;
    if (this.disposed || !this.visible || document.hidden) return;
    let animate = false;
    if (this.mode === "world" && !this.reducedMotion) {
      if (this.globe.targetYaw !== null && this.globe.targetPitch !== null) {
        let difference = this.globe.targetYaw - this.globe.yaw;
        difference = Math.atan2(Math.sin(difference), Math.cos(difference));
        this.globe.yaw += difference * 0.08;
        this.globe.pitch += (this.globe.targetPitch - this.globe.pitch) * 0.08;
        if (Math.abs(difference) < 0.002 && Math.abs(this.globe.targetPitch - this.globe.pitch) < 0.002) {
          this.globe.targetYaw = null;
          this.globe.targetPitch = null;
        } else animate = true;
      } else if (!this.selectedId && !this.hoveredId && time - this.lastTouch > 2200) {
        this.globe.yaw += 0.0014;
        animate = true;
      }
    }
    if (this.mode === "china" && this.camera.target) {
      const [x, z, distance] = this.camera.target;
      this.camera.centerX += (x - this.camera.centerX) * 0.08;
      this.camera.centerZ += (z - this.camera.centerZ) * 0.08;
      this.camera.distance += (distance - this.camera.distance) * 0.08;
      if (
        Math.abs(x - this.camera.centerX) +
          Math.abs(z - this.camera.centerZ) +
          Math.abs(distance - this.camera.distance) < 0.05
      ) {
        this.camera.target = null;
      } else animate = true;
    }
    if (this.dirty || animate || (this.selectedId !== null && !this.reducedMotion)) {
      this.draw(time);
      this.dirty = false;
    }
    if (
      animate ||
      (this.mode === "world" && !this.reducedMotion && !this.selectedId && !this.hoveredId) ||
      (this.selectedId !== null && !this.reducedMotion)
    ) {
      this.raf = window.requestAnimationFrame((nextTime) => this.frame(nextTime));
    }
  }

  private draw(time: number) {
    const scene = this.mode === "world" ? this.drawGlobe() : this.drawTerrain();
    this.drawMarkers(scene, time);
    this.canvas.dataset.rendered = "true";
  }

  private drawGlobe() {
    const projection = Mat4.perspective((30 * radians), this.width / this.height, 0.5, 30);
    const view = Mat4.translate(0, 0, -GLOBE_DISTANCE);
    const rotation = Mat4.multiply(Mat4.rotateX(this.globe.pitch), Mat4.rotateY(-this.globe.yaw));
    const rotation3 = new Float32Array([
      rotation[0], rotation[1], rotation[2],
      rotation[4], rotation[5], rotation[6],
      rotation[8], rotation[9], rotation[10],
    ]);
    const viewProjection = Mat4.multiply(
      projection,
      Mat4.multiply(view, Mat4.translate(0, 0.02, 0)),
    );
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.gl.clearColor(0, 0, 0, 0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.gl.enable(this.gl.DEPTH_TEST);
    const light = normalize([-0.55, 0.42, 0.72]);
    this.gl.useProgram(this.globeProgram.value);
    this.gl.uniformMatrix4fv(this.globeProgram.uniforms.uMVP, false, Mat4.multiply(viewProjection, rotation));
    this.gl.uniformMatrix3fv(this.globeProgram.uniforms.uRot, false, rotation3);
    this.gl.uniform3fv(this.globeProgram.uniforms.uL, light);
    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.reliefTexture);
    this.gl.uniform1i(this.globeProgram.uniforms.uTex, 0);
    this.gl.activeTexture(this.gl.TEXTURE1);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.maskTexture);
    this.gl.uniform1i(this.globeProgram.uniforms.uMask, 1);
    this.gl.bindVertexArray(this.globeVao);
    this.gl.enable(this.gl.CULL_FACE);
    this.gl.cullFace(this.gl.BACK);
    this.gl.disable(this.gl.BLEND);
    this.gl.drawElements(this.gl.TRIANGLES, this.globeCount, this.gl.UNSIGNED_INT, 0);
    const scale = new Float32Array([
      1.09, 0, 0, 0,
      0, 1.09, 0, 0,
      0, 0, 1.09, 0,
      0, 0, 0, 1,
    ]);
    this.gl.useProgram(this.atmosphereProgram.value);
    this.gl.uniformMatrix4fv(
      this.atmosphereProgram.uniforms.uMVP,
      false,
      Mat4.multiply(viewProjection, Mat4.multiply(rotation, scale)),
    );
    this.gl.uniformMatrix3fv(this.atmosphereProgram.uniforms.uRot, false, rotation3);
    this.gl.uniform3fv(this.atmosphereProgram.uniforms.uL, light);
    this.gl.cullFace(this.gl.FRONT);
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.ONE, this.gl.ONE);
    this.gl.depthMask(false);
    this.gl.drawElements(this.gl.TRIANGLES, this.globeCount, this.gl.UNSIGNED_INT, 0);
    this.gl.depthMask(true);
    this.gl.disable(this.gl.BLEND);
    this.gl.bindVertexArray(null);
    return { viewProjection, rotation };
  }

  private drawTerrain() {
    const projection = Mat4.perspective(34 * radians, this.width / this.height, 2, 900);
    const eye: Point3 = [
      this.camera.centerX + this.camera.distance * Math.cos(this.camera.pitch) * Math.sin(this.camera.yaw),
      this.camera.distance * Math.sin(this.camera.pitch),
      this.camera.centerZ + this.camera.distance * Math.cos(this.camera.pitch) * Math.cos(this.camera.yaw),
    ];
    const view = lookAt(eye, [this.camera.centerX, 2, this.camera.centerZ]);
    const viewProjection = Mat4.multiply(projection, view);
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.gl.clearColor(0.04, 0.09, 0.075, 1);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.disable(this.gl.CULL_FACE);
    this.gl.disable(this.gl.BLEND);
    this.gl.useProgram(this.terrainProgram.value);
    this.gl.uniformMatrix4fv(this.terrainProgram.uniforms.uVP, false, viewProjection);
    this.gl.uniform1f(this.terrainProgram.uniforms.uYK, HEIGHT_UNITS_PER_METRE * this.exaggeration);
    this.gl.uniform2f(this.terrainProgram.uniforms.uGrid, this.terrain.cols, this.terrain.rows);
    this.gl.uniform3fv(this.terrainProgram.uniforms.uCam, eye);
    this.gl.uniform3f(this.terrainProgram.uniforms.uBg, 0.04, 0.09, 0.075);
    this.gl.uniform1f(this.terrainProgram.uniforms.uContour, this.contours ? 1 : 0);
    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.elevationTexture);
    this.gl.uniform1i(this.terrainProgram.uniforms.uH, 0);
    this.gl.bindVertexArray(this.terrainVao);
    this.gl.drawElements(this.gl.TRIANGLES, this.terrainCount, this.gl.UNSIGNED_INT, 0);
    this.gl.bindVertexArray(null);
    return { viewProjection, eye };
  }

  private filteredWorks(region: AtlasRegion) {
    if (this.filterKey === "全部") return region.works;
    const key = region.mode === "world" ? "type" : "genre";
    return region.works.filter((work) => work[key] === this.filterKey);
  }

  private project(viewProjection: Float32Array, point: Point3): [number, number, number] | null {
    const clip = Mat4.apply(viewProjection, point);
    if (clip[3] <= 0) return null;
    return [
      (clip[0] / clip[3] * 0.5 + 0.5) * this.width,
      (1 - (clip[1] / clip[3] * 0.5 + 0.5)) * this.height,
      clip[3],
    ];
  }

  private drawMarkers(scene: { viewProjection: Float32Array; rotation?: Float32Array; eye?: Point3 }, time: number) {
    const context = this.overlay.getContext("2d");
    if (!context) return;
    context.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    context.clearRect(0, 0, this.width, this.height);
    context.globalCompositeOperation = "lighter";
    const hits: ProjectedMarker[] = [];
    const modeRegions = this.regions.filter((region) => region.mode === this.mode);
    for (const region of modeRegions) {
      const visibleCount = this.filteredWorks(region).length;
      const totalCount = region.works.length;
      if (!totalCount) continue;
      let visibility = 1;
      let base: [number, number, number] | null;
      let top: [number, number, number] | null;
      if (this.mode === "world") {
        const latitude = region.lat * radians;
        const longitude = region.lon * radians;
        const vector: Point3 = [
          Math.cos(latitude) * Math.sin(longitude),
          Math.sin(latitude),
          Math.cos(latitude) * Math.cos(longitude),
        ];
        const rotated = Mat4.apply(scene.rotation!, vector);
        if (rotated[2] < 1 / GLOBE_DISTANCE + 0.02) continue;
        visibility = clamp((rotated[2] - 1 / GLOBE_DISTANCE) * 6, 0, 1);
        const height = 0.05 + 0.045 * Math.min(visibleCount, 8);
        base = this.project(scene.viewProjection, [rotated[0], rotated[1], rotated[2]]);
        top = this.project(scene.viewProjection, [
          rotated[0] * (1 + height),
          rotated[1] * (1 + height),
          rotated[2] * (1 + height),
        ]);
      } else {
        const [x, z] = lambertConformalConic(region.lon, region.lat);
        const elevation = Math.max(this.elevationAt(region.lon, region.lat), 0);
        const y = elevation * HEIGHT_UNITS_PER_METRE * this.exaggeration;
        const height = 2.2 + visibleCount * 0.9;
        base = this.project(scene.viewProjection, [x, y, z]);
        top = this.project(scene.viewProjection, [x, y + height, z]);
      }
      if (!base || !top) continue;
      const selected = region.id === this.selectedId;
      const hovered = region.id === this.hoveredId;
      const dimmed = this.filterKey !== "全部" && visibleCount === 0;
      const alpha = visibility * (dimmed ? 0.16 : 1);
      const lineWidth = 2 + Math.min(totalCount, 6) * 0.5 + (selected || hovered ? 1.5 : 0);
      const gradient = context.createLinearGradient(base[0], base[1], top[0], top[1]);
      gradient.addColorStop(0, "rgba(224,83,58,.05)");
      gradient.addColorStop(1, selected ? "rgba(255,214,120,.95)" : "rgba(255,150,90,.9)");
      context.globalAlpha = alpha;
      context.strokeStyle = gradient;
      context.lineWidth = lineWidth + 3;
      context.lineCap = "round";
      context.beginPath();
      context.moveTo(base[0], base[1]);
      context.lineTo(top[0], top[1]);
      context.stroke();
      context.strokeStyle = selected ? "rgba(255,244,214,.95)" : "rgba(255,196,150,.85)";
      context.lineWidth = Math.max(1, lineWidth - 1.5);
      context.stroke();
      const radius = 6 + Math.sqrt(Math.max(visibleCount, 1)) * 2.6 + (selected || hovered ? 3 : 0);
      const glow = context.createRadialGradient(top[0], top[1], 0, top[0], top[1], radius * 2.2);
      glow.addColorStop(0, selected ? "rgba(255,240,190,1)" : "rgba(255,190,130,.95)");
      glow.addColorStop(0.35, selected ? "rgba(255,190,90,.55)" : "rgba(255,120,70,.45)");
      glow.addColorStop(1, "rgba(255,90,50,0)");
      context.fillStyle = glow;
      context.beginPath();
      context.arc(top[0], top[1], radius * 2.2, 0, Math.PI * 2);
      context.fill();
      const groundGlow = context.createRadialGradient(base[0], base[1], 0, base[0], base[1], 12 + visibleCount * 1.2);
      groundGlow.addColorStop(0, "rgba(255,120,70,.5)");
      groundGlow.addColorStop(1, "rgba(255,90,50,0)");
      context.fillStyle = groundGlow;
      context.beginPath();
      context.ellipse(base[0], base[1], 12 + visibleCount * 1.2, 5 + visibleCount * 0.5, 0, 0, Math.PI * 2);
      context.fill();
      if (selected && !this.reducedMotion) {
        const phase = (time % 1400) / 1400;
        context.strokeStyle = `rgba(255,214,140,${0.7 * (1 - phase)})`;
        context.lineWidth = 1.5;
        context.beginPath();
        context.ellipse(base[0], base[1], 10 + phase * 46, (10 + phase * 46) * 0.4, 0, 0, Math.PI * 2);
        context.stroke();
      }
      context.globalAlpha = 1;
      if (visibleCount >= (this.mode === "world" ? 4 : 4) || selected || hovered) {
        const label = region.name.replace(/(自治区|省|市|特别行政区|壮族|回族|维吾尔)/g, "");
        context.font = "13px var(--serif)";
        context.textAlign = "left";
        context.lineWidth = 4;
        context.strokeStyle = "rgba(6,14,12,.85)";
        context.strokeText(label, top[0] + 10, top[1] + 4);
        context.fillStyle = selected ? "#ffe3a8" : "#e9efe9";
        context.fillText(label, top[0] + 10, top[1] + 4);
      }
      hits.push({ region, topX: top[0], topY: top[1], baseX: base[0], baseY: base[1], depth: base[2], count: visibleCount });
    }
    context.globalCompositeOperation = "source-over";
    context.globalAlpha = 1;
    this.markerHits = hits;
  }

  private pick(x: number, y: number) {
    let best: ProjectedMarker | null = null;
    let bestDistance = 20;
    for (const marker of this.markerHits) {
      const topDistance = Math.hypot(x - marker.topX, y - marker.topY);
      const middleDistance = Math.hypot(
        x - (marker.topX + marker.baseX) / 2,
        y - (marker.topY + marker.baseY) / 2,
      );
      const distance = Math.min(topDistance, middleDistance);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = marker;
      }
    }
    return best;
  }

  private onPointerDown(event: PointerEvent) {
    this.stage.setPointerCapture(event.pointerId);
    this.lastPointer = [event.clientX, event.clientY];
    this.pointerMoved = 0;
    this.globe.targetYaw = null;
    this.globe.targetPitch = null;
    this.camera.target = null;
  }

  private onPointerMove(event: PointerEvent) {
    if (this.lastPointer) {
      const dx = event.clientX - this.lastPointer[0];
      const dy = event.clientY - this.lastPointer[1];
      this.pointerMoved += Math.abs(dx) + Math.abs(dy);
      this.lastPointer = [event.clientX, event.clientY];
      if (this.mode === "world") {
        this.globe.yaw -= dx * 0.006;
        this.globe.pitch = clamp(this.globe.pitch + dy * 0.005, -1.15, 1.15);
      } else {
        this.camera.yaw -= dx * 0.006;
        this.camera.pitch = clamp(this.camera.pitch + dy * 0.006, 0.32, 1.45);
      }
      this.lastTouch = performance.now();
      this.invalidate();
      return;
    }
    const rect = this.stage.getBoundingClientRect();
    const marker = this.pick(event.clientX - rect.left, event.clientY - rect.top);
    const nextId = marker?.region.id ?? null;
    if (nextId !== this.hoveredId) {
      this.hoveredId = nextId;
      this.callbacks.onHover(marker?.region ?? null, event.clientX - rect.left, event.clientY - rect.top);
      this.invalidate();
    }
    this.stage.style.cursor = marker ? "pointer" : "grab";
  }

  private onPointerUp(event: PointerEvent) {
    const didNotMove = this.pointerMoved < 6;
    this.lastPointer = null;
    this.lastTouch = performance.now();
    this.stage.style.cursor = "grab";
    if (didNotMove) {
      const rect = this.stage.getBoundingClientRect();
      const marker = this.pick(event.clientX - rect.left, event.clientY - rect.top);
      if (marker) this.callbacks.onSelect(marker.region.id);
    }
    this.invalidate();
  }

  private onPointerLeave() {
    if (this.lastPointer) return;
    if (this.hoveredId) {
      this.hoveredId = null;
      this.callbacks.onHover(null, 0, 0);
      this.invalidate();
    }
  }

  private onWheel(event: WheelEvent) {
    if (this.mode !== "china") return;
    event.preventDefault();
    this.camera.distance = clamp(this.camera.distance * (1 + event.deltaY * 0.0012), 45, 260);
    this.invalidate();
  }

  private applyCameraTarget() {
    if (!this.camera.target) return;
    [this.camera.centerX, this.camera.centerZ, this.camera.distance] = this.camera.target;
    this.camera.target = null;
  }
}
