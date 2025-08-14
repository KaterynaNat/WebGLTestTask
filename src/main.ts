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
gl.viewport(0, 0, canvas.width, canvas.height);
gl.clearColor(0.96, 0.96, 1.0, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT);

const vertexShaderSrc = `
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

const fragmentFillShaderSrc = `
  precision mediump float;
  varying vec2 v_position;

  void main() {
    float t = (v_position.y + 1.0) / 2.0;

    // Градієнт: #D5D8FC → #EAECFD
    vec3 topColor = vec3(0.835, 0.847, 0.988);   // #D5D8FC
    vec3 bottomColor = vec3(0.918, 0.925, 0.992); // #EAECFD

    vec3 color = mix(bottomColor, topColor, t);
    gl_FragColor = vec4(color, 1.0);
  }
`;

const fragmentLineShaderSrc = `
  precision mediump float;
  void main() {
    gl_FragColor = vec4(52.0 / 255.0, 15.0 / 255.0, 204.0 / 255.0, 1.0); // #340FCC
  }
`;

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

const fillProgram = createProgram(vertexShaderSrc, fragmentFillShaderSrc);
const lineProgram = createProgram(vertexShaderSrc, fragmentLineShaderSrc);

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

  if (data.length / 2 >= maxPoints) {
    data.splice(0, 2);
  }

  data.push(1, newY);
}

function generateAnimatedData(): Float32Array {
  const step = 2 / maxPoints;
  const animated: number[] = [];

  for (let i = 0; i < data.length; i += 2) {
    const x = -1 + (i / 2) * step;
    const y = data[i + 1];
    animated.push(x, y);
  }

  return new Float32Array(animated);
}

function generateFillVertices(data: Float32Array): Float32Array {
  const triangles: number[] = [];
  for (let i = 0; i < data.length - 2; i += 2) {
    const x1 = data[i];
    const y1 = data[i + 1];
    const x2 = data[i + 2];
    const y2 = data[i + 3];

    triangles.push(x1, -1, x1, y1, x2, y2);
    triangles.push(x1, -1, x2, y2, x2, -1);
  }
  return new Float32Array(triangles);
}

function draw() {
  pushNewPoint();
  const animatedData = generateAnimatedData();
  const fillVertices = generateFillVertices(animatedData);

  resizeCanvasToDisplaySize(canvas);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT);

  const aspect = canvas.width / canvas.height;

  gl.useProgram(fillProgram);
  gl.bindBuffer(gl.ARRAY_BUFFER, fillBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, fillVertices, gl.DYNAMIC_DRAW);
  gl.uniform1f(u_aspect_fill, aspect);
  gl.enableVertexAttribArray(a_position_fill);
  gl.vertexAttribPointer(a_position_fill, 2, gl.FLOAT, false, 0, 0);
  gl.drawArrays(gl.TRIANGLES, 0, fillVertices.length / 2);

  gl.useProgram(lineProgram);
  gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, animatedData, gl.DYNAMIC_DRAW);
  gl.uniform1f(u_aspect_line, aspect);
  gl.enableVertexAttribArray(a_position_line);
  gl.vertexAttribPointer(a_position_line, 2, gl.FLOAT, false, 0, 0);
  gl.lineWidth(1.0);
  gl.drawArrays(gl.LINE_STRIP, 0, animatedData.length / 2);

  setTimeout(() => requestAnimationFrame(draw), 100 + Math.random() * 200);
}

draw();
