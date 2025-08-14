export const vertexShaderSrc = `
  attribute vec2 a_position;
  uniform vec2 u_resolution;

  void main() {
    vec2 zeroToOne = a_position / u_resolution;
    vec2 clipSpace = zeroToOne * 2.0 - 1.0;
    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
  }
`;

export const fragmentShaderSrc = `
  precision mediump float;
  void main() {
    gl_FragColor = vec4(0.35, 0.16, 0.91, 1.0);  // фіолетова лінія
  }
`;
