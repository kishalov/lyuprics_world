/* =====================================================================
   Готовит карту для моря. Запуск: npm run map
   Берёт public/map.webp (остров на бумаге) и делает:
     public/map-island.webp — та же карта, но бумага вокруг острова прозрачная,
                              а рисунки в море (компас, волны, надписи) остаются чернилами;
     public/map-shore.png   — маленькая карта «близости к берегу» для шейдера моря
                              (белое у берега, чёрное в открытом море).
   Запускайте заново каждый раз, когда меняете map.webp.
   ===================================================================== */
import sharp from "sharp";

const SRC = "public/map.webp";
const OUT = "public/map-island.webp";
const SHORE = "public/map-shore.png";
const LIGHT = 185; // всё светлее этого считается бумагой
const SHORE_W = 512; // ширина карты берега
const SHORE_REACH = 0.07; // насколько далеко от берега тянутся круги (доля ширины карты)

const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height, N = W * H;
const lum = new Uint8Array(N);
for (let i = 0; i < N; i++) lum[i] = (data[i * 4] * 0.3 + data[i * 4 + 1] * 0.59 + data[i * 4 + 2] * 0.11) | 0;

// 1) море — вся бумага, до которой можно дойти от края картинки, не пересекая линий
const sea = new Uint8Array(N);
const stack = new Int32Array(N);
let sp = 0;
const seed = (i) => { if (!sea[i] && lum[i] > LIGHT) { sea[i] = 1; stack[sp++] = i; } };
for (let x = 0; x < W; x++) { seed(x); seed((H - 1) * W + x); }
for (let y = 0; y < H; y++) { seed(y * W); seed(y * W + W - 1); }
while (sp) {
  const i = stack[--sp], x = i % W;
  if (x > 0) seed(i - 1);
  if (x < W - 1) seed(i + 1);
  if (i >= W) seed(i - W);
  if (i < N - W) seed(i + W);
}

// 2) всё остальное делим на куски: самый большой — остров, крупные (свиток, компас) остаются
//    непрозрачными, мелкие (волны, буквы) превращаются в чернила на прозрачном фоне
const comp = new Int32Array(N).fill(-1);
const sizes = [];
for (let s = 0; s < N; s++) {
  if (sea[s] || comp[s] >= 0) continue;
  const id = sizes.length;
  let n = 0;
  comp[s] = id; stack[sp++] = s;
  while (sp) {
    const i = stack[--sp], x = i % W, y = (i / W) | 0;
    n++;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const xx = x + dx, yy = y + dy;
      if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
      const j = yy * W + xx;
      if (!sea[j] && comp[j] < 0) { comp[j] = id; stack[sp++] = j; }
    }
  }
  sizes.push(n);
}
const island = sizes.indexOf(Math.max(...sizes));
const keep = sizes.map((n, id) => id === island || n > N * 0.003);

// цвет бумаги — средний по морю
let pr = 0, pg = 0, pb = 0, pl = 0, pc = 0;
for (let i = 0; i < N; i++) if (sea[i]) { pr += data[i * 4]; pg += data[i * 4 + 1]; pb += data[i * 4 + 2]; pl += lum[i]; pc++; }
pr /= pc; pg /= pc; pb /= pc; pl /= pc;
const INK = 60;

const out = Buffer.alloc(N * 4);
for (let i = 0; i < N; i++) {
  const o = i * 4;
  if (!sea[i] && keep[comp[i]]) {
    out[o] = data[o]; out[o + 1] = data[o + 1]; out[o + 2] = data[o + 2]; out[o + 3] = 255;
    continue;
  }
  // чернила на прозрачном: альфа по тёмности, цвет — «вычитаем» бумагу
  const a = Math.min(1, Math.max(0, (pl - lum[i] - 10) / (pl - INK - 10)));
  if (a < 0.02) continue;
  out[o] = Math.min(255, Math.max(0, (data[o] - pr * (1 - a)) / a));
  out[o + 1] = Math.min(255, Math.max(0, (data[o + 1] - pg * (1 - a)) / a));
  out[o + 2] = Math.min(255, Math.max(0, (data[o + 2] - pb * (1 - a)) / a));
  out[o + 3] = Math.round(a * 255);
}
await sharp(out, { raw: { width: W, height: H, channels: 4 } }).webp({ quality: 90, alphaQuality: 100 }).toFile(OUT);

// 3) близость к берегу: расстояние до острова на уменьшенной сетке (двухпроходная фаска)
const sw = SHORE_W, sh = Math.round((SHORE_W * H) / W), k = W / sw;
const dist = new Float32Array(sw * sh);
for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) {
  const i = Math.min(H - 1, Math.round((y + 0.5) * k)) * W + Math.min(W - 1, Math.round((x + 0.5) * k));
  dist[y * sw + x] = comp[i] === island ? 0 : 1e9;
}
const D = Math.SQRT2;
const relax = (i, j, c) => { if (dist[j] + c < dist[i]) dist[i] = dist[j] + c; };
for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) {
  const i = y * sw + x;
  if (x > 0) relax(i, i - 1, 1);
  if (y > 0) { relax(i, i - sw, 1); if (x > 0) relax(i, i - sw - 1, D); if (x < sw - 1) relax(i, i - sw + 1, D); }
}
for (let y = sh - 1; y >= 0; y--) for (let x = sw - 1; x >= 0; x--) {
  const i = y * sw + x;
  if (x < sw - 1) relax(i, i + 1, 1);
  if (y < sh - 1) { relax(i, i + sw, 1); if (x < sw - 1) relax(i, i + sw + 1, D); if (x > 0) relax(i, i + sw - 1, D); }
}
const reach = sw * SHORE_REACH;
const shore = Buffer.alloc(sw * sh);
for (let i = 0; i < sw * sh; i++) shore[i] = Math.round(255 * Math.max(0, 1 - dist[i] / reach));
await sharp(shore, { raw: { width: sw, height: sh, channels: 1 } }).blur(1.2).png().toFile(SHORE);

console.log(`Готово: ${OUT} (${W}×${H}), ${SHORE} (${sw}×${sh}); кусков в море: ${sizes.length - 1}`);
