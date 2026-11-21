/* =====================================================================
   Фон сайта — плитка с травой:  node scripts/build-grass.mjs
   Пишет public/grass.svg: светлый зелёный фон и пучки травы из трёх
   штрихов, разбросанные «случайно», но одинаково при каждом запуске.
   Цвета и густота — в настройках ниже.
   ===================================================================== */
import fs from "node:fs";

const TILE = 240; // размер плитки, px
const CELLS = 4; // сетка 4×4 — по пучку в клетке, со сдвигом
const BG = "#d9eab4"; // трава
const INK = "#97bb63"; // штрихи
const SEED = 7;

// простой генератор случайных чисел с зерном — чтобы плитка не менялась от запуска к запуску
let s = SEED;
const rnd = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
const r1 = (n) => Math.round(n * 10) / 10;

const cell = TILE / CELLS;
const tufts = [];
for (let y = 0; y < CELLS; y++)
  for (let x = 0; x < CELLS; x++) {
    const cx = x * cell + 10 + rnd() * (cell - 20);
    const cy = y * cell + 10 + rnd() * (cell - 20);
    const blades = 2 + Math.round(rnd()); // 2–3 травинки
    const d = [];
    for (let i = 0; i < blades; i++) {
      const bx = cx + i * 2.6 + (rnd() - 0.5);
      const h = 4 + rnd() * 3;
      const tilt = (rnd() - 0.5) * 1.8;
      d.push(`M${r1(bx)} ${r1(cy)}l${r1(tilt)} -${r1(h)}`);
    }
    tufts.push(d.join(""));
  }

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${TILE}" height="${TILE}" viewBox="0 0 ${TILE} ${TILE}">
<rect width="${TILE}" height="${TILE}" fill="${BG}"/>
<path d="${tufts.join("")}" fill="none" stroke="${INK}" stroke-width="1.5" stroke-linecap="round"/>
</svg>
`;
fs.writeFileSync("public/grass.svg", svg);
console.log(`public/grass.svg: ${tufts.length} пучков на плитке ${TILE}×${TILE}`);
