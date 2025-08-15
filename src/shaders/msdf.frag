#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texcoord;
varying vec3 v_color;

uniform sampler2D u_texture;

float median(float r, float g, float b) {
    return max(min(r, g), min(max(r, g), b));
}

void main() {
    vec3 sample = texture2D(u_texture, v_texcoord).rgb;
    float sd = median(sample.r, sample.g, sample.b) - 0.5;

    float alpha = smoothstep(-0.015, 0.015, sd);

    if (alpha < 0.01) discard;

    gl_FragColor = vec4(v_color, alpha);
}
