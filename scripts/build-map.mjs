/* =====================================================================
   Подготовка слоёв карты:  npm run map

   Берёт PNG-слои из art-src/map/ (все на одном холсте, с прозрачностью),
   обрезает пустоту вокруг каждого, сохраняет лёгкие WebP в public/map/
   и записывает их положение в src/data/map-layers.generated.ts.

   Имя файла = id слоя (латиница, дефисы). Его же пишут в world.ts в поле layer.
   После перерисовки в Procreate просто замените PNG и запустите npm run map ещё раз.
   ===================================================================== */
import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";

const SRC = "art-src/map";
const OUT = "public/map";
const TS_OUT = "src/data/map-layers.generated.ts";
const PREVIEW = "art-src/map-preview.png"; // необязательно: из неё делается обложка карты на главной

/** Подложка (материк) — рисуется первой и не нажимается */
const BASE = "materik";
/** Порядок наложения снизу вверх. Слои, которых нет в списке, встанут по нижнему краю (что ниже — то ближе). */
const ORDER = [
  "materik", "mys", "rynok", "kruzhye", "bezdna-hu", "pitychiy-les", "mistikorp", "holmy",
  "hrebet", "zagorye", "barhonda", "amorantikum", "shepchushchee", "yagodnyy",
];
const PAD = 4; // запас в пикселях вокруг обрезки

async function alphaBox(file) {
  const img = sharp(file).ensureAlpha();
  const { width, height } = await img.metadata();
  const { data } = await img.clone().extractChannel(3).raw().toBuffer({ resolveWithObject: true });
  let x0 = width, y0 = height, x1 = -1, y1 = -1;
  for (let y = 0; y < height; y++) {
    const row = y * width;
    for (let x = 0; x < width; x++) {
      if (data[row + x] > 8) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) return null;
  x0 = Math.max(0, x0 - PAD); y0 = Math.max(0, y0 - PAD);
  x1 = Math.min(width - 1, x1 + PAD); y1 = Math.min(height - 1, y1 + PAD);
  return { width, height, left: x0, top: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

const r = (n) => Math.round(n * 1000) / 1000;

/* ---------- море: карта расстояний до берега ----------
   Силуэт суши берётся из подложки (материка): рисунки поверх неё, вроде маяка,
   могут заходить на море, но берегом не считаются. Для каждой точки моря считается
   расстояние до ближайшего берега в пикселях картинки шириной SEA_W (до 255,
   с точностью 1/256: старший байт в красном канале, младший — в зелёном).
   По этим расстояниям шейдер рисует мелководье, прибой и волны вокруг материка. */
const SEA_W = 960;
const INF = 1e20;

/** Точное евклидово расстояние в одну сторону (Felzenszwalb & Huttenlocher) */
function edt1d(f, n, out, v, z) {
  let k = 0;
  v[0] = 0; z[0] = -INF; z[1] = INF;
  const cross = (q, p) => (f[q] + q * q - (f[p] + p * p)) / (2 * q - 2 * p);
  for (let q = 1; q < n; q++) {
    let s = cross(q, v[k]);
    while (s <= z[k]) s = cross(q, v[--k]);
    k++; v[k] = q; z[k] = s; z[k + 1] = INF;
  }
  k = 0;
  for (let q = 0; q < n; q++) {
    while (z[k + 1] < q) k++;
    out[q] = (q - v[k]) * (q - v[k]) + f[v[k]];
  }
}

async function buildSea(canvas) {
  const W = SEA_W;
  const H = Math.round((W * canvas.h) / canvas.w);
  const g = new Float64Array(W * H).fill(INF);
  const { data } = await sharp(path.join(SRC, `${BASE}.png`)).ensureAlpha().resize(W, H, { fit: "fill" }).extractChannel(3).raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < W * H; i++) if (data[i] > 100) g[i] = 0;
  const n = Math.max(W, H);
  const f = new Float64Array(n), d = new Float64Array(n), v = new Int32Array(n), z = new Float64Array(n + 1);
  for (let x = 0; x < W; x++) {
    for (let y = 0; y < H; y++) f[y] = g[y * W + x];
    edt1d(f, H, d, v, z);
    for (let y = 0; y < H; y++) g[y * W + x] = d[y];
  }
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) f[x] = g[y * W + x];
    edt1d(f, W, d, v, z);
    for (let x = 0; x < W; x++) g[y * W + x] = d[x];
  }
  const out = Buffer.alloc(W * H * 3);
  for (let i = 0; i < W * H; i++) {
    const v = Math.min(65535, Math.round(Math.sqrt(g[i]) * 256));
    out[i * 3] = v >> 8;
    out[i * 3 + 1] = v & 255;
  }
  await sharp(out, { raw: { width: W, height: H, channels: 3 } }).png({ compressionLevel: 9 }).toFile(path.join(OUT, "sea.png"));
  console.log(`  море: ${W}×${H}`);
  return { w: W, h: H };
}

async function main() {
  const files = (await fs.readdir(SRC)).filter((f) => f.toLowerCase().endsWith(".png"));
  if (!files.length) throw new Error(`В ${SRC} нет PNG-файлов`);
  await fs.rm(OUT, { recursive: true, force: true });
  await fs.mkdir(OUT, { recursive: true });

  let canvas = null;
  const layers = [];
  for (const f of files) {
    const id = path.basename(f, path.extname(f));
    if (!/^[a-z0-9-]+$/.test(id)) throw new Error(`Имя файла «${f}»: используйте латиницу, цифры и дефисы`);
    const file = path.join(SRC, f);
    const box = await alphaBox(file);
    if (!box) { console.warn(`  пропущен пустой слой ${f}`); continue; }
    if (!canvas) canvas = { w: box.width, h: box.height };
    if (box.width !== canvas.w || box.height !== canvas.h)
      throw new Error(`${f}: размер ${box.width}×${box.height}, а у остальных ${canvas.w}×${canvas.h}. Все слои должны быть на одном холсте.`);
    await sharp(file)
      .extract({ left: box.left, top: box.top, width: box.w, height: box.h })
      .webp({ quality: 90, alphaQuality: 100, effort: 5 })
      .toFile(path.join(OUT, `${id}.webp`));
    layers.push({ id, box });
    console.log(`  ${id}: ${box.w}×${box.h}`);
  }

  const z = (id, box) => {
    const i = ORDER.indexOf(id);
    return i >= 0 ? i : 1000 + box.top + box.h;
  };
  layers.sort((a, b) => z(a.id, a.box) - z(b.id, b.box));

  const sea = await buildSea(canvas);

  const v = Date.now().toString(36); // сбрасывает кэш браузера после перерисовки
  const items = layers.map(({ id, box }) =>
    `  { id: ${JSON.stringify(id)}, src: "/map/${id}.webp?v=${v}", base: ${id === BASE}, ` +
    `x: ${r((box.left / canvas.w) * 100)}, y: ${r((box.top / canvas.h) * 100)}, ` +
    `w: ${r((box.w / canvas.w) * 100)}, h: ${r((box.h / canvas.h) * 100)} },`,
  );
  const ts = `/* Файл создан командой npm run map — не правьте вручную. */
import type { MapLayer } from "./map-types";

/** Размер холста в пикселях */
export const MAP_CANVAS = { w: ${canvas.w}, h: ${canvas.h} };

/** Слои снизу вверх. x, y, w, h — в процентах холста. */
export const MAP_LAYERS: MapLayer[] = [
${items.join("\n")}
];

/** Карта расстояний до берега для моря: 1 пиксель = 1/${sea.w} ширины холста, расстояние = (R·256 + G) / 256 в этих пикселях */
export const MAP_SEA = { src: "/map/sea.png?v=${v}", w: ${sea.w}, h: ${sea.h} };
`;
  await fs.writeFile(TS_OUT, ts);

  try {
    await fs.access(PREVIEW);
    await sharp(PREVIEW).resize(1600, null, { withoutEnlargement: true }).webp({ quality: 82 }).toFile("public/map-cover.webp");
    console.log("  обложка карты на главной: public/map-cover.webp");
  } catch {}

  console.log(`Готово: ${layers.length} слоёв, холст ${canvas.w}×${canvas.h}`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
