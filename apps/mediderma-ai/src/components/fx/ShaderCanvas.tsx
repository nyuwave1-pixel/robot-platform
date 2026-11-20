"use client";
/**
 * 경량 GLSL 모션 그래픽 (순수 WebGL, 라이브러리 없음).
 * 화면에 보일 때만 렌더링하고, 모션 최소화 설정이면 한 프레임만 그린다.
 *  rf         — 고주파: 중심에서 퍼지는 따뜻한 열 파동
 *  ultrasonic — 초음파: 두 진원의 간섭 파형
 *  ionto      — 이온토포레시스: 표면으로 흘러드는 입자 흐름
 *  aurora     — 배경용 유동 그라디언트
 */
import { useEffect, useRef } from "react";

export type ShaderKind = "rf" | "ultrasonic" | "ionto" | "aurora";

const HEAD = `precision highp float; uniform vec2 r; uniform float t; uniform vec2 m;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*n(p);p*=2.02;a*=.5;}return s;}`;

const BODY: Record<ShaderKind, string> = {
  rf: `void main(){vec2 u=(gl_FragCoord.xy-.5*r)/r.y;vec2 c=u-vec2(m.x*.25,-.08+m.y*.15);float d=length(c);
    float w=sin(d*26.-t*3.2+fbm(u*3.+t*.2)*2.5);float ring=smoothstep(.55,1.,w)*exp(-d*2.6);
    float core=exp(-d*d*9.);float haze=fbm(u*2.4+vec2(0.,-t*.25))*exp(-d*1.8);
    vec3 col=vec3(1.,.55,.18)*ring*1.3+vec3(1.,.82,.5)*core*.9+vec3(.95,.25,.35)*haze*.55;
    col+=vec3(.03,.035,.05);gl_FragColor=vec4(col,1.);}`,
  ultrasonic: `void main(){vec2 u=(gl_FragCoord.xy-.5*r)/r.y;vec2 a=vec2(-.32+m.x*.1,-.1),b=vec2(.32+m.x*.1,.12);
    float w=sin(length(u-a)*42.-t*5.)+sin(length(u-b)*42.-t*5.);
    float line=smoothstep(.0,.06,abs(w)-1.25);float glow=pow(max(0.,w*.5),2.);
    float fall=exp(-length(u)*1.5);
    vec3 col=vec3(.25,.78,1.)*line*fall*1.1+vec3(.6,.95,1.)*glow*fall*.35;
    col+=vec3(.02,.03,.05);gl_FragColor=vec4(col,1.);}`,
  ionto: `void main(){vec2 uv=gl_FragCoord.xy/r;vec2 u=(gl_FragCoord.xy-.5*r)/r.y;vec3 col=vec3(.025,.02,.05);
    float surf=.26+sin(u.x*5.+t*.8)*.012;
    for(int i=0;i<3;i++){float fi=float(i);vec2 g=vec2(u.x*(14.+fi*9.),uv.y*(3.+fi));
      float id=floor(g.x);float sp=.25+h(vec2(id,fi))*.55;float y=fract(g.y+t*sp+h(vec2(id,fi+7.)));
      float x=abs(fract(g.x)-.5);float streak=smoothstep(.12,.0,x)*smoothstep(.0,.5,y)*smoothstep(1.,.75,y);
      float above=smoothstep(surf,surf+.05,uv.y);
      col+=mix(vec3(.55,.35,1.),vec3(.45,.85,1.),h(vec2(id,3.+fi)))*streak*(.25+.75*above)*(.6-fi*.15);}
    float sl=smoothstep(.012,.0,abs(uv.y-surf));col+=vec3(.75,.6,1.)*sl*1.2;
    float under=smoothstep(surf,0.,uv.y);col+=vec3(.3,.2,.8)*under*(.25+.2*sin(u.x*20.-t*2.))*fbm(u*4.+t*.2);
    gl_FragColor=vec4(col,1.);}`,
  aurora: `void main(){vec2 u=gl_FragCoord.xy/r;vec2 p=u*vec2(2.2,1.3)+vec2(t*.03,0.);
    float f=fbm(p+fbm(p*1.7+t*.05)*1.4);float band=smoothstep(.25,.8,f)*smoothstep(1.,.2,u.y+f*.3);
    vec3 col=mix(vec3(.02,.03,.05),vec3(.1,.42,.9),band*.85)+vec3(.5,.85,1.)*pow(band,5.)*.5;
    col*=.55+.45*smoothstep(1.3,.2,length(u-vec2(.5+m.x*.1,.45)));gl_FragColor=vec4(col,1.);}`,
};

export default function ShaderCanvas({ kind, className = "" }: { kind: ShaderKind; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
    if (!gl) return;
    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}"));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, HEAD + BODY[kind]));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uR = gl.getUniformLocation(prog, "r");
    const uT = gl.getUniformLocation(prog, "t");
    const uM = gl.getUniformLocation(prog, "m");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let visible = false;
    const mouse = [0, 0];
    const start = performance.now();
    const resize = () => {
      const dpr = Math.min(1.5, window.devicePixelRatio || 1);
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };
    const draw = () => {
      resize();
      gl.uniform2f(uR, canvas.width, canvas.height);
      gl.uniform1f(uT, (performance.now() - start) / 1000);
      gl.uniform2f(uM, mouse[0], mouse[1]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (visible && !reduce) raf = requestAnimationFrame(draw);
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible) draw();
    });
    io.observe(canvas);
    const onMove = (e: PointerEvent) => {
      const b = canvas.getBoundingClientRect();
      mouse[0] = ((e.clientX - b.left) / b.width - 0.5) * 2;
      mouse[1] = -((e.clientY - b.top) / b.height - 0.5) * 2;
    };
    canvas.parentElement?.addEventListener("pointermove", onMove);
    const parent = canvas.parentElement;
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      parent?.removeEventListener("pointermove", onMove);
      // 컨텍스트는 캔버스와 함께 회수된다 (StrictMode 재마운트 시 같은 캔버스를 다시 쓰므로 여기서 버리지 않는다)
      gl.deleteProgram(prog);
      gl.deleteBuffer(buf);
    };
  }, [kind]);
  return <canvas ref={ref} aria-hidden className={`block h-full w-full ${className}`} />;
}
