import "./style.css";

const canvas = document.getElementById("webgl-canvas") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const gl = canvas.getContext("webgl");

if (!gl) {
  alert("WebGL not supported");
} else {
  gl.clearColor(0.97, 0.97, 1.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
}
