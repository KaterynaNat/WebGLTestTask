precision mediump float;

uniform sampler2D u_texture;
varying vec2 v_texcoord;

float median(float r, float g, float b) {
  return max(min(r, g), min(max(r, g), b));
}

void main() {
  vec3 sample = texture2D(u_texture, v_texcoord).rgb;
  float sdf = median(sample.r, sample.g, sample.b);
  float alpha = smoothstep(0.5 - 0.1, 0.5 + 0.1, sdf);
  gl_FragColor = vec4(vec3(0.0, 0.0, 0.0), alpha);
}
