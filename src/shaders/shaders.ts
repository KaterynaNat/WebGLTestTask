export const vertexShaderSrc = `
  attribute vec2 a_position;
  uniform vec2 u_resolution;
  varying vec2 v_position;

  void main() {
    vec2 zeroToOne = a_position / u_resolution;
    vec2 zeroToTwo = zeroToOne * 2.0;
    vec2 clipSpace = zeroToTwo - 1.0;

    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
    v_position = a_position;
  }
`;

export const fragmentShaderSrc = `
  precision mediump float;
  varying vec2 v_position;
  uniform float u_height;

  void main() {
    float alpha = 1.0 - (v_position.y / u_height);
    gl_FragColor = vec4(0.5, 0.2, 1.0, alpha * 0.6);
  }
`;
