attribute vec2 a_position;
attribute vec2 a_texcoord;
attribute vec3 a_color;

varying vec2 v_texcoord;
varying vec3 v_color;

void main() {
    v_texcoord = a_texcoord;
    v_color = a_color;
    gl_Position = vec4(a_position, 0.0, 1.0);
}
