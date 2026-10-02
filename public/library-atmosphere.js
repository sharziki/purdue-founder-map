/* Original ambient dust shader. Decorative only; the room works without WebGL. */
(() => {
  const canvas=document.getElementById('atmosphere');
  const gl=canvas.getContext('webgl',{alpha:true,antialias:false,premultipliedAlpha:false});
  if(!gl) return;
  const compile=(type,source)=>{const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){gl.deleteShader(shader);return null;}return shader;};
  const vertex=compile(gl.VERTEX_SHADER,'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}');
  const fragment=compile(gl.FRAGMENT_SHADER,`precision mediump float;
    uniform vec2 resolution; uniform float time;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    void main(){
      vec2 uv=gl_FragCoord.xy/resolution;
      vec2 field=uv*vec2(38.,25.)+vec2(time*.012,time*.025);
      vec2 cell=floor(field), local=fract(field);
      vec2 center=vec2(hash(cell),hash(cell+19.));
      float dust=(1.-smoothstep(.0,.035,length(local-center)))*step(.58,hash(cell+5.));
      float light=exp(-length((uv-vec2(.77,.46))*vec2(2.,1.8))*3.);
      float pulse=.88+.12*sin(time*.34);
      gl_FragColor=vec4(vec3(.86,.72,.45),dust*light*.34+light*.018*pulse);
    }`);
  if(!vertex||!fragment)return;
  const program=gl.createProgram();gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))return;
  gl.useProgram(program);const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const p=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(p);gl.vertexAttribPointer(p,2,gl.FLOAT,false,0,0);
  const res=gl.getUniformLocation(program,'resolution'),time=gl.getUniformLocation(program,'time');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),reader=document.getElementById('reader');let raf=0,last=0,lost=false;
  function draw(t=0){if(lost)return;gl.uniform1f(time,t*.001);gl.drawArrays(gl.TRIANGLES,0,6);}
  function size(){const dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(innerWidth*dpr);canvas.height=Math.round(innerHeight*dpr);gl.viewport(0,0,canvas.width,canvas.height);gl.uniform2f(res,canvas.width,canvas.height);draw();}
  function tick(t){if(t-last>50){draw(t);last=t;}raf=requestAnimationFrame(tick);}
  function sync(){cancelAnimationFrame(raf);if(!lost&&!document.hidden&&reader.hidden&&!reduced.matches)raf=requestAnimationFrame(tick);else draw();}
  const observer=new MutationObserver(sync);observer.observe(reader,{attributes:true,attributeFilter:['hidden']});
  reduced.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);addEventListener('resize',size);
  canvas.addEventListener('webglcontextlost',()=>{lost=true;cancelAnimationFrame(raf);canvas.hidden=true;});
  addEventListener('pagehide',()=>cancelAnimationFrame(raf));addEventListener('pageshow',sync);
  size();sync();
})();
