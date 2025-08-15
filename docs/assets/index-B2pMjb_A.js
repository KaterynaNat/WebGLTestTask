(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))i(r);new MutationObserver(r=>{for(const a of r)if(a.type==="childList")for(const l of a.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&i(l)}).observe(document,{childList:!0,subtree:!0});function n(r){const a={};return r.integrity&&(a.integrity=r.integrity),r.referrerPolicy&&(a.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?a.credentials="include":r.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function i(r){if(r.ep)return;r.ep=!0;const a=n(r);fetch(r.href,a)}})();const le=`attribute vec2 a_position;\r
attribute vec2 a_texcoord;\r
attribute vec3 a_color;\r
\r
varying vec2 v_texcoord;\r
varying vec3 v_color;\r
\r
void main() {\r
    v_texcoord = a_texcoord;\r
    v_color = a_color;\r
    gl_Position = vec4(a_position, 0.0, 1.0);\r
}\r
`,ue=`#ifdef GL_ES\r
precision mediump float;\r
#endif\r
\r
varying vec2 v_texcoord;\r
varying vec3 v_color;\r
\r
uniform sampler2D u_texture;\r
\r
float median(float r, float g, float b) {\r
    return max(min(r, g), min(max(r, g), b));\r
}\r
\r
void main() {\r
    vec3 sample = texture2D(u_texture, v_texcoord).rgb;\r
    float sd = median(sample.r, sample.g, sample.b) - 0.5;\r
    float alpha = smoothstep(-0.02, 0.02, sd);\r
    gl_FragColor = vec4(v_color, alpha);\r
}\r
`,_e=`attribute vec2 a_position;\r
attribute vec2 a_texcoord;\r
\r
uniform float u_aspect;\r
\r
varying vec2 v_texcoord;\r
\r
void main() {\r
    vec2 pos = a_position;\r
    pos.x *= u_aspect; // Врахування пропорцій екрану\r
    gl_Position = vec4(pos, 0.0, 1.0);\r
    v_texcoord = a_texcoord;\r
}\r
`,Ae=`precision mediump float;\r
uniform sampler2D u_image;\r
varying vec2 v_texcoord;\r
\r
void main() {\r
  vec4 texColor = texture2D(u_image, v_texcoord);\r
  if (texColor.a < 0.1) discard;\r
  gl_FragColor = texColor;\r
}\r
`,_=document.querySelector("canvas"),e=_.getContext("webgl");function z(o){const t=window.devicePixelRatio||1,n=Math.floor(o.clientWidth*t),i=Math.floor(o.clientHeight*t);(o.width!==n||o.height!==i)&&(o.width=n,o.height=i)}function q(o,t){const n=e.createShader(o);if(e.shaderSource(n,t),e.compileShader(n),!e.getShaderParameter(n,e.COMPILE_STATUS))throw new Error(e.getShaderInfoLog(n));return n}function b(o,t){const n=q(e.VERTEX_SHADER,o),i=q(e.FRAGMENT_SHADER,t),r=e.createProgram();if(e.attachShader(r,n),e.attachShader(r,i),e.linkProgram(r),!e.getProgramParameter(r,e.LINK_STATUS))throw new Error(e.getProgramInfoLog(r));return r}function de(o){return fetch(o).then(t=>t.json())}function j(o){return new Promise((t,n)=>{const i=new Image;i.onload=()=>t(i),i.onerror=n,i.src=o})}const w=b(`
attribute vec2 a_position;
uniform float u_aspect;
varying vec2 v_position;
void main() {
  vec2 pos = a_position;
  pos.x *= u_aspect;
  gl_Position = vec4(pos, 0.0, 1.0);
  v_position = a_position;
}
`,`
precision mediump float;
varying vec2 v_position;
void main() {
   float t = (v_position.y + 1.0) / 2.0;
  vec3 top = vec3(0.694, 0.745, 1.0);      
  vec3 bottom = vec3(0.918, 0.925, 0.992);
  gl_FragColor = vec4(mix(bottom, top, t), 1.0);
}
`),I=b(`
attribute vec2 a_position;
uniform float u_aspect;
void main() {
  vec2 pos = a_position;
  pos.x *= u_aspect;
  gl_Position = vec4(pos, 0.0, 1.0);
}
`,`
precision mediump float;
void main() {
  gl_FragColor = vec4(52.0/255.0, 15.0/255.0, 204.0/255.0, 1.0);
}
`),p=b(le,ue),h=b(_e,Ae),me=e.getUniformLocation(w,"u_aspect"),ge=e.getUniformLocation(I,"u_aspect"),Re=e.getUniformLocation(h,"u_aspect"),pe=e.getUniformLocation(p,"u_texture"),he=e.getUniformLocation(h,"u_image"),K=e.getAttribLocation(w,"a_position"),J=e.getAttribLocation(I,"a_position"),Q=e.getAttribLocation(p,"a_position"),Z=e.getAttribLocation(p,"a_texcoord"),$=e.getAttribLocation(p,"a_color"),k=e.getAttribLocation(h,"a_position"),ee=e.getAttribLocation(h,"a_texcoord"),xe=e.createBuffer(),Ee=e.createBuffer(),te=e.createBuffer(),re=e.createBuffer(),N=300,A=[];function oe(){let t=(A.length>0?A[A.length-1]:0)+(Math.random()-.5)*.02;t=Math.max(-1,Math.min(1,t)),A.length/2>=N&&A.splice(0,2),A.push(1,t)}function Te(){const o=2/N,t=[];for(let n=0;n<A.length;n+=2){const i=-1+n/2*o,r=A[n+1];t.push(i,r)}return new Float32Array(t)}function ve(o){const t=[];for(let n=0;n<o.length-2;n+=2){const[i,r,a,l]=[o[n],o[n+1],o[n+2],o[n+3]];t.push(i,-1,i,r,a,l),t.push(i,-1,a,l,a,-1)}return new Float32Array(t)}async function be(){z(_);const o=_.width/_.height,t=await de("/IBMPlexMono-Bold-msdf.json"),n=await j("/IBMPlexMono-Bold.png"),i=await j("/arrow.png"),r=e.createTexture();e.bindTexture(e.TEXTURE_2D,r),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,e.RGBA,e.UNSIGNED_BYTE,n),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR);const a=e.createTexture();e.bindTexture(e.TEXTURE_2D,a),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,e.RGBA,e.UNSIGNED_BYTE,i),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR);const l=new Map(t.chars.map(c=>[c.char,c])),ne=["BTC / USDT · Binance","114,900.00","1.00% · 1,140.87"],ie=[.05,.1,.05],ae=[[0,0,0],[0,0,0],[52/255,15/255,204/255]],F=[],Y=[],C=[];let M=.85,d=0,m=0;ne.forEach((c,R)=>{const f=1/_.height*64*ie[R],u=f*t.common.lineHeight*1;let B=-[...c].reduce((x,s)=>{const E=l.get(s);return E?x+E.xadvance*f:x},0)/2,V=M;R===1&&(d=B-.06,m=V-.015);for(const x of c){const s=l.get(x);if(!s)continue;const E=s.width*f,fe=s.height*f,T=B+s.xoffset*f,v=V-s.yoffset*f,y=T+E,U=v-fe,D=s.x/t.common.scaleW,L=s.y/t.common.scaleH,P=(s.x+s.width)/t.common.scaleW,S=(s.y+s.height)/t.common.scaleH;F.push(T,v,y,v,T,U,T,U,y,v,y,U),Y.push(D,L,P,L,D,S,D,S,P,L,P,S);for(let H=0;H<6;H++)C.push(...ae[R]);B+=s.xadvance*f}M-=u});const O=e.createBuffer();e.bindBuffer(e.ARRAY_BUFFER,O),e.bufferData(e.ARRAY_BUFFER,new Float32Array(F),e.STATIC_DRAW);const X=e.createBuffer();e.bindBuffer(e.ARRAY_BUFFER,X),e.bufferData(e.ARRAY_BUFFER,new Float32Array(Y),e.STATIC_DRAW);const G=e.createBuffer();e.bindBuffer(e.ARRAY_BUFFER,G),e.bufferData(e.ARRAY_BUFFER,new Float32Array(C),e.STATIC_DRAW);const g=.04,ce=new Float32Array([d,m,d+g,m,d,m-g,d,m-g,d+g,m,d+g,m-g]),se=new Float32Array([0,0,1,0,0,1,0,1,1,0,1,1]);e.bindBuffer(e.ARRAY_BUFFER,te),e.bufferData(e.ARRAY_BUFFER,ce,e.STATIC_DRAW),e.bindBuffer(e.ARRAY_BUFFER,re),e.bufferData(e.ARRAY_BUFFER,se,e.STATIC_DRAW);for(let c=0;c<N;c++)oe();function W(){oe();const c=Te(),R=ve(c);z(_),e.viewport(0,0,_.width,_.height),e.clearColor(.96,.96,1,1),e.clear(e.COLOR_BUFFER_BIT),e.useProgram(w),e.bindBuffer(e.ARRAY_BUFFER,xe),e.bufferData(e.ARRAY_BUFFER,R,e.DYNAMIC_DRAW),e.uniform1f(me,o),e.enableVertexAttribArray(K),e.vertexAttribPointer(K,2,e.FLOAT,!1,0,0),e.drawArrays(e.TRIANGLES,0,R.length/2),e.useProgram(I),e.bindBuffer(e.ARRAY_BUFFER,Ee),e.bufferData(e.ARRAY_BUFFER,c,e.DYNAMIC_DRAW),e.uniform1f(ge,o),e.enableVertexAttribArray(J),e.vertexAttribPointer(J,2,e.FLOAT,!1,0,0),e.drawArrays(e.LINE_STRIP,0,c.length/2);const f=new Float32Array(c.length);for(let u=0;u<c.length;u+=2)f[u]=c[u],f[u+1]=c[u+1]-.005;e.bufferData(e.ARRAY_BUFFER,f,e.DYNAMIC_DRAW),e.drawArrays(e.LINE_STRIP,0,f.length/2),e.useProgram(p),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,r),e.uniform1i(pe,0),e.bindBuffer(e.ARRAY_BUFFER,O),e.enableVertexAttribArray(Q),e.vertexAttribPointer(Q,2,e.FLOAT,!1,0,0),e.bindBuffer(e.ARRAY_BUFFER,X),e.enableVertexAttribArray(Z),e.vertexAttribPointer(Z,2,e.FLOAT,!1,0,0),e.bindBuffer(e.ARRAY_BUFFER,G),e.enableVertexAttribArray($),e.vertexAttribPointer($,3,e.FLOAT,!1,0,0),e.drawArrays(e.TRIANGLES,0,F.length/2),e.useProgram(h),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,a),e.uniform1i(he,0),e.uniform1f(Re,o),e.bindBuffer(e.ARRAY_BUFFER,te),e.enableVertexAttribArray(k),e.vertexAttribPointer(k,2,e.FLOAT,!1,0,0),e.bindBuffer(e.ARRAY_BUFFER,re),e.enableVertexAttribArray(ee),e.vertexAttribPointer(ee,2,e.FLOAT,!1,0,0),e.enable(e.BLEND),e.blendFunc(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA),e.drawArrays(e.TRIANGLES,0,6),e.disable(e.BLEND),requestAnimationFrame(W)}W()}be();
