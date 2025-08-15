import msdfVertexShader from "./shaders/msdf.vert?raw";
import msdfFragmentShader from "./shaders/msdf.frag?raw";
import iconVertexShader from "./shaders/icon.vert?raw";
import iconFragmentShader from "./shaders/icon.frag?raw";

const canvas = document.querySelector("canvas")!;
const gl = canvas.getContext("webgl")!;

// Resize
function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement) {
  const dpr = window.devicePixelRatio || 1;
  const width = Math.floor(canvas.clientWidth * dpr);
  const height = Math.floor(canvas.clientHeight * dpr);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
}

// Shader
function createShader(type: number, source: string): WebGLShader {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader)!);
  }
  return shader;
}

// Program
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

// Assets
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

const fillProgram = createProgram(
  `
attribute vec2 a_position;
uniform float u_aspect;
varying vec2 v_position;
void main() {
  vec2 pos = a_position;
  pos.x *= u_aspect;
  gl_Position = vec4(pos, 0.0, 1.0);
  v_position = a_position;
}
`,
  `
precision mediump float;
varying vec2 v_position;
void main() {
   float t = (v_position.y + 1.0) / 2.0;
  vec3 top = vec3(0.694, 0.745, 1.0);      
  vec3 bottom = vec3(0.918, 0.925, 0.992);
  gl_FragColor = vec4(mix(bottom, top, t), 1.0);
}
`
);

const lineProgram = createProgram(
  `
attribute vec2 a_position;
uniform float u_aspect;
void main() {
  vec2 pos = a_position;
  pos.x *= u_aspect;
  gl_Position = vec4(pos, 0.0, 1.0);
}
`,
  `
precision mediump float;
void main() {
  gl_FragColor = vec4(52.0/255.0, 15.0/255.0, 204.0/255.0, 1.0);
}
`
);

const textProgram = createProgram(msdfVertexShader, msdfFragmentShader);
const iconProgram = createProgram(iconVertexShader, iconFragmentShader);

// Uniforms
const u_aspect_fill = gl.getUniformLocation(fillProgram, "u_aspect");
const u_aspect_line = gl.getUniformLocation(lineProgram, "u_aspect");
const u_aspect_icon = gl.getUniformLocation(iconProgram, "u_aspect");

const u_texture = gl.getUniformLocation(textProgram, "u_texture");
const u_image = gl.getUniformLocation(iconProgram, "u_image");

// Attributes
const a_position_fill = gl.getAttribLocation(fillProgram, "a_position");
const a_position_line = gl.getAttribLocation(lineProgram, "a_position");

const a_position_text = gl.getAttribLocation(textProgram, "a_position");
const a_texcoord_text = gl.getAttribLocation(textProgram, "a_texcoord");
const a_color_text = gl.getAttribLocation(textProgram, "a_color");

const a_position_icon = gl.getAttribLocation(iconProgram, "a_position");
const a_texcoord_icon = gl.getAttribLocation(iconProgram, "a_texcoord");

// Buffers
const fillBuffer = gl.createBuffer();
const lineBuffer = gl.createBuffer();
const iconBuffer = gl.createBuffer();
const iconTexBuffer = gl.createBuffer();

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
  resizeCanvasToDisplaySize(canvas);
  const aspect = canvas.width / canvas.height;

  const font = await loadJSON<{ chars: Glyph[]; common: any }>(
    "/IBMPlexMono-Bold-msdf.json"
  );
  const fontImage = await loadImage("/IBMPlexMono-Bold.png");
  const arrowImage = await loadImage("/arrow.png");

  // Textures
  const fontTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, fontTexture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    fontImage
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  const arrowTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, arrowTexture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    arrowImage
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  // Text Geometry
  const chars = new Map<string, Glyph>(font.chars.map((c) => [c.char, c]));
  const lines = ["BTC / USDT · Binance", "114,900.00", "1.00% · 1,140.87"];
  const fontSizes = [0.05, 0.1, 0.05];
  const colors = [
    [0.0, 0.0, 0.0],
    [0.0, 0.0, 0.0],
    [52 / 255, 15 / 255, 204 / 255],
  ];

  const positions: number[] = [];
  const texcoords: number[] = [];
  const colorData: number[] = [];

  let yCursor = 0.85;
  let arrowX = 0;
  let arrowY = 0;

  lines.forEach((line, index) => {
    const scale = (1 / canvas.height) * 64 * fontSizes[index];
    const lineHeight = scale * font.common.lineHeight * 1;
    const lineWidth = [...line].reduce((w, ch) => {
      const g = chars.get(ch);
      return g ? w + g.xadvance * scale : w;
    }, 0);

    let x = -lineWidth / 2;
    let yBase = yCursor;

    if (index === 1) {
      arrowX = x - 0.06;
      arrowY = yBase - 0.015;
    }

    for (const ch of line) {
      const glyph = chars.get(ch);
      if (!glyph) continue;

      const w = glyph.width * scale;
      const h = glyph.height * scale;
      const x0 = x + glyph.xoffset * scale;
      const y0 = yBase - glyph.yoffset * scale;
      const x1 = x0 + w;
      const y1 = y0 - h;

      const u0 = glyph.x / font.common.scaleW;
      const v0 = glyph.y / font.common.scaleH;
      const u1 = (glyph.x + glyph.width) / font.common.scaleW;
      const v1 = (glyph.y + glyph.height) / font.common.scaleH;

      positions.push(x0, y0, x1, y0, x0, y1, x0, y1, x1, y0, x1, y1);
      texcoords.push(u0, v0, u1, v0, u0, v1, u0, v1, u1, v0, u1, v1);
      for (let i = 0; i < 6; i++) colorData.push(...colors[index]);

      x += glyph.xadvance * scale;
    }

    yCursor -= lineHeight;
  });

  // Text buffers
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  const texcoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoords), gl.STATIC_DRAW);

  const colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colorData), gl.STATIC_DRAW);

  // Arrow icon
  const iconSize = 0.04;
  const iconVerts = new Float32Array([
    arrowX,
    arrowY,
    arrowX + iconSize,
    arrowY,
    arrowX,
    arrowY - iconSize,
    arrowX,
    arrowY - iconSize,
    arrowX + iconSize,
    arrowY,
    arrowX + iconSize,
    arrowY - iconSize,
  ]);
  const iconUV = new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]);

  gl.bindBuffer(gl.ARRAY_BUFFER, iconBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, iconVerts, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, iconTexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, iconUV, gl.STATIC_DRAW);

  for (let i = 0; i < maxPoints; i++) pushNewPoint();

  function render() {
    pushNewPoint();
    const lineData = generateAnimatedData();
    const fillData = generateFill(lineData);

    resizeCanvasToDisplaySize(canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.96, 0.96, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Fill
    gl.useProgram(fillProgram);
    gl.bindBuffer(gl.ARRAY_BUFFER, fillBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, fillData, gl.DYNAMIC_DRAW);
    gl.uniform1f(u_aspect_fill, aspect);
    gl.enableVertexAttribArray(a_position_fill);
    gl.vertexAttribPointer(a_position_fill, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, fillData.length / 2);

    // Line
    gl.useProgram(lineProgram);
    gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, lineData, gl.DYNAMIC_DRAW);
    gl.uniform1f(u_aspect_line, aspect);
    gl.enableVertexAttribArray(a_position_line);
    gl.vertexAttribPointer(a_position_line, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.LINE_STRIP, 0, lineData.length / 2);
    const offsetData = new Float32Array(lineData.length);
    for (let i = 0; i < lineData.length; i += 2) {
      offsetData[i] = lineData[i];
      offsetData[i + 1] = lineData[i + 1] - 0.005;
    }
    gl.bufferData(gl.ARRAY_BUFFER, offsetData, gl.DYNAMIC_DRAW);
    gl.drawArrays(gl.LINE_STRIP, 0, offsetData.length / 2);

    // Text
    gl.useProgram(textProgram);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, fontTexture);
    gl.uniform1i(u_texture, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(a_position_text);
    gl.vertexAttribPointer(a_position_text, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
    gl.enableVertexAttribArray(a_texcoord_text);
    gl.vertexAttribPointer(a_texcoord_text, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.enableVertexAttribArray(a_color_text);
    gl.vertexAttribPointer(a_color_text, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, positions.length / 2);

    // Icon
    gl.useProgram(iconProgram);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, arrowTexture);
    gl.uniform1i(u_image, 0);
    gl.uniform1f(u_aspect_icon, aspect);
    gl.bindBuffer(gl.ARRAY_BUFFER, iconBuffer);
    gl.enableVertexAttribArray(a_position_icon);
    gl.vertexAttribPointer(a_position_icon, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, iconTexBuffer);
    gl.enableVertexAttribArray(a_texcoord_icon);
    gl.vertexAttribPointer(a_texcoord_icon, 2, gl.FLOAT, false, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.disable(gl.BLEND);

    requestAnimationFrame(render);
  }

  render();
}

main();
