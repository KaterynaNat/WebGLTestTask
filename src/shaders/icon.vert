attribute vec2 a_position;
attribute vec2 a_texcoord;

uniform float u_aspect;

varying vec2 v_texcoord;

void main() {
    vec2 pos = a_position;
    pos.x *= u_aspect; // Врахування пропорцій екрану
    gl_Position = vec4(pos, 0.0, 1.0);
    v_texcoord = a_texcoord;
}
