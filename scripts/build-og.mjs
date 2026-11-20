/* =====================================================================
   Картинка для превью ссылок (соцсети, мессенджеры):  npm run og

   Берёт art-src/og.png (любой размер) и делает public/og.jpg 1200×630:
   картинка целиком по центру, по бокам — её же размытая копия, без полос.
   ===================================================================== */
import sharp from "sharp";

const SRC = "art-src/og.png";
const OUT = "public/og.jpg";
const W = 1200;
const H = 630;

const back = await sharp(SRC).resize(W, H, { fit: "cover" }).blur(28).modulate({ brightness: 0.7 }).toBuffer();
const front = await sharp(SRC).resize(W, H, { fit: "inside" }).toBuffer();
await sharp(back).composite([{ input: front, gravity: "center" }]).jpeg({ quality: 86, mozjpeg: true }).toFile(OUT);
console.log(`Готово: ${OUT} (${W}×${H})`);
