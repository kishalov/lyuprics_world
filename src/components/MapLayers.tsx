"use client";

import { useEffect } from "react";
import { MAP_LAYERS } from "@/data/map-layers.generated";
import { getLayer } from "@/lib/world";

/* Маски прозрачности слоёв: по ним понятно, на какой рисунок попал курсор,
   с точностью до формы, а не прямоугольника. Строятся один раз в браузере. */
type Mask = { w: number; h: number; a: Uint8Array };
const masks = new Map<string, Mask>();
const MASK_SCALE = 0.25;

function buildMask(id: string, img: HTMLImageElement) {
  const w = Math.max(1, Math.round(img.naturalWidth * MASK_SCALE));
  const h = Math.max(1, Math.round(img.naturalHeight * MASK_SCALE));
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx) return;
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;
  const a = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) a[i] = data[i * 4 + 3];
  masks.set(id, { w, h, a });
}

/** Какой из слоёв (id) лежит сверху в точке x, y (проценты холста) */
export function hitLayer(layerIds: string[], x: number, y: number): string | null {
  const sorted = layerIds.map((id) => getLayer(id)).filter(Boolean).sort((a, b) => b!.z - a!.z);
  for (const l of sorted) {
    if (!l) continue;
    if (x < l.x || y < l.y || x > l.x + l.w || y > l.y + l.h) continue;
    const m = masks.get(l.id);
    if (!m) return l.id; // маска ещё не готова — хватит прямоугольника
    const mx = Math.floor(((x - l.x) / l.w) * m.w);
    const my = Math.floor(((y - l.y) / l.h) * m.h);
    if (m.a[my * m.w + mx] > 40) return l.id;
  }
  return null;
}

export default function MapLayers({ hot, focus }: { hot: string | null; focus: string | null }) {
  useEffect(() => {
    MAP_LAYERS.filter((l) => !l.base && !masks.has(l.id)).forEach((l) => {
      const img = new Image();
      img.src = l.src;
      img
        .decode()
        .then(() => buildMask(l.id, img))
        .catch(() => {});
    });
  }, []);

  return (
    <>
      {MAP_LAYERS.map((l) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={l.id}
          src={l.src}
          alt=""
          draggable={false}
          className={
            "layer-img" + (l.base ? " base" : "") + (hot === l.id ? " hot" : "") + (focus && !l.base && focus !== l.id ? " dim" : "")
          }
          style={{ left: l.x + "%", top: l.y + "%", width: l.w + "%", height: l.h + "%" }}
        />
      ))}
    </>
  );
}
