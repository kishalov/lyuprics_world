/* Файл создан командой npm run map — не правьте вручную. */
import type { MapLayer } from "./map-types";

/** Размер холста в пикселях */
export const MAP_CANVAS = { w: 3840, h: 2160 };

/** Слои снизу вверх. x, y, w, h — в процентах холста. */
export const MAP_LAYERS: MapLayer[] = [
  { id: "materik", src: "/map/materik.webp?v=mwo0o9zg", base: true, x: 6.068, y: 3.056, w: 88.203, h: 93.241 },
  { id: "mys", src: "/map/mys.webp?v=mwo0o9zg", base: false, x: 66.38, y: 0.833, w: 5.964, h: 15.88 },
  { id: "rynok", src: "/map/rynok.webp?v=mwo0o9zg", base: false, x: 41.875, y: 6.111, w: 12.995, h: 15.741 },
  { id: "kruzhye", src: "/map/kruzhye.webp?v=mwo0o9zg", base: false, x: 25.156, y: 12.963, w: 18.359, h: 17.87 },
  { id: "bezdna-hu", src: "/map/bezdna-hu.webp?v=mwo0o9zg", base: false, x: 63.307, y: 37.222, w: 21.38, h: 21.991 },
  { id: "pitychiy-les", src: "/map/pitychiy-les.webp?v=mwo0o9zg", base: false, x: 23.411, y: 15.88, w: 52.24, h: 36.157 },
  { id: "mistikorp", src: "/map/mistikorp.webp?v=mwo0o9zg", base: false, x: 82.5, y: 23.519, w: 9.818, h: 31.852 },
  { id: "holmy", src: "/map/holmy.webp?v=mwo0o9zg", base: false, x: 8.125, y: 32.361, w: 15.99, h: 23.38 },
  { id: "hrebet", src: "/map/hrebet.webp?v=mwo0o9zg", base: false, x: 19.792, y: 46.944, w: 45.234, h: 14.12 },
  { id: "zagorye", src: "/map/zagorye.webp?v=mwo0o9zg", base: false, x: 28.88, y: 60.556, w: 22.188, h: 16.481 },
  { id: "barhonda", src: "/map/barhonda.webp?v=mwo0o9zg", base: false, x: 10.833, y: 54.954, w: 19.193, h: 23.056 },
  { id: "amorantikum", src: "/map/amorantikum.webp?v=mwo0o9zg", base: false, x: 74.974, y: 50.926, w: 17.188, h: 28.102 },
  { id: "shepchushchee", src: "/map/shepchushchee.webp?v=mwo0o9zg", base: false, x: 50.443, y: 59.769, w: 20.547, h: 21.435 },
  { id: "yagodnyy", src: "/map/yagodnyy.webp?v=mwo0o9zg", base: false, x: 60.599, y: 59.444, w: 21.146, h: 32.778 },
];
