"use client";

import { useEffect, useRef } from "react";
import { MAP_SEA } from "@/data/map-layers.generated";
import type { Camera } from "@/lib/camera";

/* =====================================================================
   МОРЕ ВОКРУГ МАТЕРИКА — WebGL-шейдер под слоями карты.

   Шейдер знает расстояние от каждой точки моря до берега материка
   (public/map/sea.png, создаётся командой npm run map) и рисует по нему:
     • полосы глубины — у берега светлее, вдали темнее;
     • прибой — белую пену у самой кромки;
     • кольца пены, которые расходятся от берега по его форме;
     • рисованные значки волн в открытом море.
   Расстояния — в «пикселях моря»: 1/960 ширины холста карты.
   Каждый кадр шейдер берёт положение камеры, поэтому море двигается вместе с картой.
   Цвета и размеры удобно менять в блоке «настройки» внутри FRAG.
   ===================================================================== */

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform sampler2D uDist;
uniform vec2 uRes;     // размер холста в пикселях устройства
uniform vec2 uOrigin;  // левый верхний угол карты на экране
uniform vec2 uSize;    // размер карты на экране
uniform vec2 uTex;     // размер карты расстояний
uniform float uTime;

// ---------- настройки ----------
const vec3 SHALLOW = vec3(0.663, 0.867, 0.835); // мелководье
const vec3 MID     = vec3(0.533, 0.792, 0.820);
const vec3 DEEP    = vec3(0.420, 0.710, 0.796);
const vec3 ABYSS   = vec3(0.357, 0.635, 0.765); // открытое море
const vec3 FOAM    = vec3(0.976, 0.984, 0.957);
const float BAND1 = 22.0, BAND2 = 52.0, BAND3 = 105.0; // границы полос глубины
const float RING_STEP = 11.0;   // расстояние между кольцами пены
const float RING_SPEED = 0.16;  // скорость, с которой кольца уходят от берега
const float RING_REACH = 40.0;  // как далеко от берега видны кольца
const float WAVE_CELL = 44.0;   // сетка значков волн в открытом море

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
// 1 на линии полуширины w (с мягким краем aa), 0 вне её
float line(float dist, float w, float aa) { return 1.0 - smoothstep(w - aa, w + aa, dist); }

// расстояние, записанное в пиксель i карты расстояний: (R·256 + G) / 256
float texel(vec2 i) {
  vec2 c = floor(texture2D(uDist, (i + 0.5) / uTex).rg * 255.0 + 0.5);
  return (c.r * 256.0 + c.g) / 256.0;
}
// плавное расстояние между пикселями (вручную, чтобы не терять точность)
float field(vec2 tp) {
  vec2 q = clamp(tp - 0.5, vec2(0.0), uTex - 1.0);
  vec2 i = min(floor(q), uTex - 2.0);
  vec2 f = q - i;
  return mix(mix(texel(i), texel(i + vec2(1.0, 0.0)), f.x), mix(texel(i + vec2(0.0, 1.0)), texel(i + vec2(1.0, 1.0)), f.x), f.y);
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 uv = (p - uOrigin) / uSize;
  vec2 tp = uv * uTex;                 // точка в пикселях моря
  float px = uTex.x / uSize.x;         // сколько пикселей моря в одном пикселе экрана
  float aa = px * 0.9;
  float t = uTime;

  // расстояние до берега; за краем карты достраиваем его по прямой
  float d = field(tp) + length(tp - clamp(tp, vec2(0.0), uTex));

  // рисованная неровность
  float n1 = noise(tp * 0.035 + vec2(t * 0.05, -t * 0.04));
  float n2 = noise(tp * 0.12 - t * 0.07);
  float dw = d + (n1 - 0.5) * 10.0 + (n2 - 0.5) * 3.0;

  // полосы глубины
  vec3 col = ABYSS;
  col = mix(col, DEEP, 1.0 - smoothstep(BAND3 - aa, BAND3 + aa, dw));
  col = mix(col, MID, 1.0 - smoothstep(BAND2 - aa, BAND2 + aa, dw));
  col = mix(col, SHALLOW, 1.0 - smoothstep(BAND1 - aa, BAND1 + aa, dw));

  // кольца пены: расходятся от берега и тают
  float ph = (dw - 4.0) / RING_STEP - t * RING_SPEED;
  float id = floor(ph + 0.5);
  float ringDist = abs(ph - id) * RING_STEP;
  float dash = smoothstep(0.32, 0.48, noise(tp * 0.05 + vec2(id * 7.13, id * 3.71)));
  float ringFade = (1.0 - smoothstep(RING_REACH * 0.35, RING_REACH, d)) * smoothstep(2.5, 6.0, d);
  float ring = line(ringDist, max(px * 1.15, 0.45), aa) * dash * ringFade;
  col = mix(col, FOAM, ring * 0.9);

  // прибой у самой кромки
  float surf = 2.4 + 1.1 * sin(t * 1.4 + n1 * 6.2831);
  col = mix(col, FOAM, line(d + (n2 - 0.5) * 2.0, surf, aa + 0.3));

  // значки волн в открытом море: две «дуги», которые то появляются, то тают
  vec2 g = tp / WAVE_CELL;
  vec2 gi = floor(g);
  float h = hash(gi);
  vec2 off = vec2(hash(gi + 3.1), hash(gi + 7.7)) * 0.5 + 0.25;
  vec2 lp = (g - gi - off) * WAVE_CELL;
  lp.x += sin(t * 0.35 + h * 6.2831) * 2.5;
  float wy = -abs(sin(lp.x * 0.5236)) * 2.2;     // две горбинки шириной по 6
  float inside = 1.0 - smoothstep(5.0, 6.0, abs(lp.x));
  float blink = smoothstep(0.25, 0.75, 0.5 + 0.5 * sin(t * 0.45 + h * 40.0));
  float wave = line(abs(lp.y - wy), max(px * 1.1, 0.35), aa) * inside * blink * step(0.45, h) * smoothstep(48.0, 70.0, d);
  col = mix(col, FOAM, wave * 0.75);

  // лёгкая виньетка и бумажное зерно
  vec2 q = p / uRes - 0.5;
  col *= 1.0 - 0.10 * smoothstep(0.35, 0.85, length(q * vec2(uRes.x / uRes.y, 1.0)));
  col += (hash(p) - 0.5) * 0.018;

  gl_FragColor = vec4(col, 1.0);
}
`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || "shader");
  return s;
}

/** Море под картой. Пока карта скрыта (active = false), не рисует. */
export default function Sea({ cam, active }: { cam: Camera; active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    const canvas = ref.current;
    const gl = canvas?.getContext("webgl", { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: "low-power" });
    if (!canvas || !gl) return; // без WebGL остаётся ровный цвет моря из CSS

    let prog: WebGLProgram;
    try {
      prog = gl.createProgram()!;
      gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) || "link");
    } catch (e) {
      console.warn("Море: шейдер не собрался", e);
      return;
    }
    gl.useProgram(prog);

    // один треугольник на весь экран
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const u = (name: string) => gl.getUniformLocation(prog, name);
    const uRes = u("uRes"), uOrigin = u("uOrigin"), uSize = u("uSize"), uTex = u("uTex"), uTime = u("uTime");
    gl.uniform1i(u("uDist"), 0);
    gl.uniform2f(uTex, MAP_SEA.w, MAP_SEA.h);

    let ready = false;
    const img = new Image();
    img.onload = () => {
      const tex = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      // это данные, а не картинка: никаких цветовых преобразований
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      ready = true;
    };
    img.src = MAP_SEA.src;

    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    const t0 = performance.now();
    let raf = 0;
    let shown = false;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!ready || !activeRef.current) return;
      const { W, H, w, h } = cam.base();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const cw = Math.round(W * dpr), ch = Math.round(H * dpr);
      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw;
        canvas.height = ch;
      }
      gl.viewport(0, 0, cw, ch);
      // то же преобразование, что камера применяет к слоям карты
      const c = cam.c;
      gl.uniform2f(uRes, cw, ch);
      gl.uniform2f(uOrigin, (W / 2 - (c.x / 100) * w * c.s) * dpr, (H / 2 - (c.y / 100) * h * c.s) * dpr);
      gl.uniform2f(uSize, w * c.s * dpr, h * c.s * dpr);
      gl.uniform1f(uTime, still.matches ? 20 : (now - t0) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!shown) {
        shown = true;
        canvas.classList.add("on");
      }
    };
    raf = requestAnimationFrame(frame);

    return () => cancelAnimationFrame(raf);
  }, [cam]);

  return <canvas ref={ref} className="sea" aria-hidden="true" />;
}
