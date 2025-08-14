import msdfVertexShader from "./shaders/msdf.vert?raw";
import msdfFragmentShader from "./shaders/msdf.frag?raw";

const canvas = document.querySelector("canvas")!;
if (!(canvas instanceof HTMLCanvasElement)) throw new Error("Canvas not found");

const gl = canvas.getContext("webgl")!;
if (!gl) throw new Error("WebGL not supported");

function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement) {
  const dpr = window.devicePixelRatio || 1;
  const width = Math.floor(canvas.clientWidth * dpr);
  const height = Math.floor(canvas.clientHeight * dpr);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
}
resizeCanvasToDisplaySize(canvas);

function createShader(type: number, source: string): WebGLShader {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader)!);
  }
  return shader;
}

function createProgram(vertexSrc: string, fragmentSrc: string): WebGLProgram {
  const vertexShader = createShader(gl.VERTEX_SHADER, vertexSrc);
  const fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentSrc);
  const program = gl.createProgram()!;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program)!);
  }
  return program;
}

function loadJSON<T>(url: string): Promise<T> {
  return fetch(url).then((res) => res.json());
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

interface Glyph {
  char: string;
  width: number;
  height: number;
  xoffset: number;
  yoffset: number;
  xadvance: number;
  x: number;
  y: number;
}

const lineVertexShader = `
  attribute vec2 a_position;
  uniform float u_aspect;
  varying vec2 v_position;
  void main() {
    vec2 pos = a_position;
    pos.x *= u_aspect;
    gl_Position = vec4(pos, 0.0, 1.0);
    v_position = a_position;
  }
`;

const fillFragmentShader = `
  precision mediump float;
  varying vec2 v_position;
  void main() {
    float t = (v_position.y + 1.0) / 2.0;
    vec3 top = vec3(0.835, 0.847, 0.988);
    vec3 bottom = vec3(0.918, 0.925, 0.992);
    gl_FragColor = vec4(mix(bottom, top, t), 1.0);
  }
`;

const lineFragmentShader = `
  precision mediump float;
  void main() {
    gl_FragColor = vec4(52.0/255.0, 15.0/255.0, 204.0/255.0, 1.0);
  }
`;

const fillProgram = createProgram(lineVertexShader, fillFragmentShader);
const lineProgram = createProgram(lineVertexShader, lineFragmentShader);

const a_position_fill = gl.getAttribLocation(fillProgram, "a_position");
const u_aspect_fill = gl.getUniformLocation(fillProgram, "u_aspect");
const a_position_line = gl.getAttribLocation(lineProgram, "a_position");
const u_aspect_line = gl.getUniformLocation(lineProgram, "u_aspect");

const fillBuffer = gl.createBuffer();
const lineBuffer = gl.createBuffer();

const maxPoints = 300;
const data: number[] = [];
function pushNewPoint() {
  const lastY = data.length > 0 ? data[data.length - 1] : 0;
  let newY = lastY + (Math.random() - 0.5) * 0.02;
  newY = Math.max(-1, Math.min(1, newY));
  if (data.length / 2 >= maxPoints) data.splice(0, 2);
  data.push(1, newY);
}
function generateAnimatedData(): Float32Array {
  const step = 2 / maxPoints;
  const out: number[] = [];
  for (let i = 0; i < data.length; i += 2) {
    const x = -1 + (i / 2) * step;
    const y = data[i + 1];
    out.push(x, y);
  }
  return new Float32Array(out);
}
function generateFill(data: Float32Array): Float32Array {
  const tri: number[] = [];
  for (let i = 0; i < data.length - 2; i += 2) {
    const [x1, y1, x2, y2] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
    tri.push(x1, -1, x1, y1, x2, y2);
    tri.push(x1, -1, x2, y2, x2, -1);
  }
  return new Float32Array(tri);
}

async function main() {
  const font = await loadJSON<{ chars: Glyph[]; common: any }>(
    "/custom-msdf.json"
  );
  const image = await loadImage("/custom.png");

  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  const chars = new Map<string, Glyph>(font.chars.map((c) => [c.char, c]));
  const text = "Hello World";
  const scale = (1 / canvas.height) * 2;
  const positions: number[] = [];
  const texcoords: number[] = [];
  let x = -0.85;

  for (const ch of text) {
    const glyph = chars.get(ch);
    if (!glyph) continue;

    const w = glyph.width * scale;
    const h = glyph.height * scale;
    const x0 = x + glyph.xoffset * scale;
    const y0 = 0.85 - glyph.yoffset * scale;
    const x1 = x0 + w;
    const y1 = y0 - h;

    const u0 = glyph.x / font.common.scaleW;
    const v0 = glyph.y / font.common.scaleH;
    const u1 = (glyph.x + glyph.width) / font.common.scaleW;
    const v1 = (glyph.y + glyph.height) / font.common.scaleH;

    positions.push(x0, y0, x1, y0, x0, y1, x0, y1, x1, y0, x1, y1);
    texcoords.push(u0, v0, u1, v0, u0, v1, u0, v1, u1, v0, u1, v1);
    x += glyph.xadvance * scale;
  }

  const textProgram = createProgram(msdfVertexShader, msdfFragmentShader);
  const a_position = gl.getAttribLocation(textProgram, "a_position");
  const a_texcoord = gl.getAttribLocation(textProgram, "a_texcoord");
  const u_texture = gl.getUniformLocation(textProgram, "u_texture");

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  const texcoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoords), gl.STATIC_DRAW);

  function render() {
    pushNewPoint();
    const lineData = generateAnimatedData();
    const fillData = generateFill(lineData);

    resizeCanvasToDisplaySize(canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    const aspect = canvas.width / canvas.height;

    gl.useProgram(fillProgram);
    gl.bindBuffer(gl.ARRAY_BUFFER, fillBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, fillData, gl.DYNAMIC_DRAW);
    gl.uniform1f(u_aspect_fill, aspect);
    gl.enableVertexAttribArray(a_position_fill);
    gl.vertexAttribPointer(a_position_fill, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, fillData.length / 2);

    gl.useProgram(lineProgram);
    gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, lineData, gl.DYNAMIC_DRAW);
    gl.uniform1f(u_aspect_line, aspect);
    gl.enableVertexAttribArray(a_position_line);
    gl.vertexAttribPointer(a_position_line, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.LINE_STRIP, 0, lineData.length / 2);

    gl.useProgram(textProgram);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(u_texture, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(a_position);
    gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
    gl.enableVertexAttribArray(a_texcoord);
    gl.vertexAttribPointer(a_texcoord, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, positions.length / 2);

    requestAnimationFrame(render);
  }

  render();
}

main();
