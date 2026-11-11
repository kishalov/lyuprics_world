"use client";

import { useEffect, useRef, useState } from "react";
import type { Camera } from "@/lib/camera";

/* =====================================================================
   МОРЕ под общей картой: шейдер WebGL на весь экран.
   Волны привязаны к карте, поэтому вместе с ней приближаются и двигаются.
   map-shore.png (делает `npm run map`) подсказывает, где берег:
   там вода светлее, есть пена и круги от берега.
   Цвета — в константах ниже, в формате RGB от 0 до 1.
   ===================================================================== */

const SHORE_IMAGE = "/map-shore.png";

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
precision mediump float;
uniform vec2 uRes;      // размер холста, px
uniform vec2 uOrigin;   // левый верхний угол карты на холсте, px
uniform vec2 uSize;     // размер карты на холсте, px
uniform float uAspect;  // ширина / высота карты
uniform float uTime;
uniform sampler2D uShore;

const vec3 DEEP    = vec3(0.329, 0.506, 0.553);
const vec3 SHALLOW = vec3(0.553, 0.729, 0.725);
const vec3 FOAM    = vec3(0.949, 0.906, 0.851); // цвет бумаги
const vec3 INK     = vec3(0.294, 0.169, 0.137);

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.03 + 17.0; a *= 0.5; }
  return v;
}

void main() {
  vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 uv = (px - uOrigin) / uSize;              // 0..1 — координаты на карте
  vec2 p = vec2(uv.x * uAspect, uv.y) * 7.0;     // «мировые» координаты для волн
  float t = uTime;
  float pxu = 7.0 / uSize.y;                     // сколько единиц p в одном пикселе

  // близость к берегу: 1 у самого берега, 0 в открытом море
  vec2 suv = clamp(uv, 0.0, 1.0);
  float edge = step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);
  float shore = texture2D(uShore, suv).r * edge;

  // течение: медленно искажаем пространство шумом
  vec2 q = p + 0.6 * vec2(fbm(p * 0.5 + vec2(t * 0.03, 0.0)), fbm(p * 0.5 + vec2(5.2, -t * 0.025)));

  // цвет воды: пятна глубины + мелководье у берега
  float depth = fbm(q * 0.7 + vec2(0.0, t * 0.02));
  vec3 col = mix(DEEP, SHALLOW, clamp(depth * 0.55 + pow(shore, 1.6) * 0.75, 0.0, 1.0));

  // блики-волны в открытом море: короткие светлые штрихи, бегущие вдоль течения
  vec2 w = vec2(q.x * 1.4 - t * 0.12, q.y * 4.5 + sin(q.x * 2.2 + t * 0.6) * 0.35);
  float row = fract(w.y);
  float aa = pxu * 4.5 * 1.5;
  float stroke = smoothstep(0.5 - 0.06 - aa, 0.5 - 0.06, row) * (1.0 - smoothstep(0.5 + 0.06, 0.5 + 0.06 + aa, row));
  float dash = smoothstep(0.62, 0.78, noise(vec2(w.x * 1.3, floor(w.y) * 7.13)));
  float breathe = 0.5 + 0.5 * sin(t * 0.8 + floor(w.y) * 2.1 + w.x * 0.7);
  col = mix(col, FOAM, stroke * dash * breathe * 0.45 * (1.0 - shore));

  // круги от берега: линии, параллельные берегу, медленно уходят в море
  float d = 1.0 - shore;
  float ring = sin(d * 42.0 - t * 0.9 + fbm(q * 1.5) * 3.0);
  float rings = smoothstep(0.82, 0.97, ring) * smoothstep(0.02, 0.45, shore) * (1.0 - smoothstep(0.85, 0.97, shore));
  col = mix(col, FOAM, rings * 0.38);

  // пена у самого берега
  float foam = smoothstep(0.9, 0.97, shore + (fbm(q * 3.0 + t * 0.15) - 0.5) * 0.06);
  col = mix(col, FOAM, foam * 0.85);

  // бумажное зерно и лёгкое затемнение к краям экрана
  col *= 0.97 + 0.06 * hash(floor(px * 0.5));
  vec2 sc = px / uRes - 0.5;
  col = mix(col, col * vec3(0.86, 0.84, 0.82), smoothstep(0.35, 0.85, length(sc)));
  col = mix(col, INK, 0.04);

  gl_FragColor = vec4(col, 1.0);
}
`;

export default function Sea({ camera, aspect, active }: { camera: Camera; aspect: number; active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(active);
  const wake = useRef<() => void>(() => {});
  const [gen, setGen] = useState(0);

  useEffect(() => {
    activeRef.current = active;
    if (active) wake.current();
  }, [active]);

  useEffect(() => {
    const canvas = ref.current;
    const gl = canvas?.getContext("webgl", { antialias: false, alpha: false, premultipliedAlpha: false });
    if (!canvas || !gl || gl.isContextLost()) return; // без WebGL останется ровный цвет моря из CSS

    // браузер может отобрать контекст (например, на телефоне в фоне) — тогда запускаемся заново
    const onLost = (e: Event) => e.preventDefault();
    const onRestored = () => setGen((g) => g + 1);
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.warn("[sea]", gl.getShaderInfoLog(s));
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      return;
    }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const u = (n: string) => gl.getUniformLocation(prog, n);
    const uRes = u("uRes"), uOrigin = u("uOrigin"), uSize = u("uSize"), uAspect = u("uAspect"), uTime = u("uTime");

    // пока картинка берега грузится — пустая (чёрная) текстура: просто нет пены
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, 1, 1, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, new Uint8Array([0]));
    for (const [k, v] of [
      [gl.TEXTURE_MIN_FILTER, gl.LINEAR],
      [gl.TEXTURE_MAG_FILTER, gl.LINEAR],
      [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE],
      [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE],
    ])
      gl.texParameteri(gl.TEXTURE_2D, k, v);
    const img = new Image();
    img.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, gl.LUMINANCE, gl.UNSIGNED_BYTE, img);
      wake.current();
    };
    img.src = SHORE_IMAGE;

    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    const t0 = performance.now();
    let raf = 0;
    let last = "";

    // кадр за кадром, пока карта видна; при «уменьшить движение» рисуем только когда сдвинулась камера
    const frame = (now: number) => {
      raf = 0;
      if (!activeRef.current) return;
      raf = requestAnimationFrame(frame);
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const W = canvas.clientWidth, H = canvas.clientHeight;
      const cw = Math.max(1, Math.round(W * dpr)), ch = Math.max(1, Math.round(H * dpr));
      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw;
        canvas.height = ch;
        gl.viewport(0, 0, cw, ch);
      }
      // где сейчас карта на экране — те же формулы, что в Camera.apply
      const { w, h } = camera.base();
      const c = camera.c;
      const ox = W / 2 - (c.x / 100) * w * c.s, oy = H / 2 - (c.y / 100) * h * c.s;
      const key = [cw, ch, ox, oy, c.s].join();
      if (still.matches && key === last) return;
      last = key;
      gl.uniform2f(uRes, cw, ch);
      gl.uniform2f(uOrigin, ox * dpr, oy * dpr);
      gl.uniform2f(uSize, w * c.s * dpr, h * c.s * dpr);
      gl.uniform1f(uAspect, aspect);
      gl.uniform1f(uTime, still.matches ? 20 : (now - t0) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    wake.current = () => {
      last = "";
      if (!raf) raf = requestAnimationFrame(frame);
    };
    wake.current();

    return () => {
      cancelAnimationFrame(raf);
      wake.current = () => {};
      // контекст не убиваем: React в режиме разработки запускает эффект дважды
      // на том же холсте, и второму запуску нужен живой контекст
      gl.deleteTexture(tex);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
    };
  }, [camera, aspect, gen]);

  return <canvas ref={ref} id="sea" aria-hidden="true" />;
}
