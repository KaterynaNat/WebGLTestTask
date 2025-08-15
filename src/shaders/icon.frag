precision mediump float;
uniform sampler2D u_image;
varying vec2 v_texcoord;

void main() {
  vec4 texColor = texture2D(u_image, v_texcoord);
  if (texColor.a < 0.1) discard;
  gl_FragColor = texColor;
}
