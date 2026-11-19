import { WORLD, type WorldNode, type View } from "@/data/world";
import { MAP_LAYERS, MAP_CANVAS } from "@/data/map-layers.generated";

const byId: Record<string, WorldNode> = {};
const parentOf: Record<string, string> = {};

(function index(n: WorldNode, p: WorldNode | null) {
  if (byId[n.id]) throw new Error(`Повторяющийся id в world.ts: ${n.id}`);
  byId[n.id] = n;
  if (p) parentOf[n.id] = p.id;
  (n.children || []).forEach((c) => index(c, n));
})(WORLD, null);

export const getNode = (id: string): WorldNode | undefined => byId[id];
export const getParentId = (id: string): string | undefined => parentOf[id];
export const getParent = (id: string): WorldNode | undefined => (parentOf[id] ? byId[parentOf[id]] : undefined);

/** Цепочка от мира до узла: [world, регион, …, узел] */
export function pathTo(id: string): WorldNode[] {
  const out: WorldNode[] = [];
  for (let k: string | undefined = id; k; k = parentOf[k]) out.unshift(byId[k]);
  return out;
}

/** Адрес страницы для узла: /pitychiy-les/kruzhye */
export function urlFor(id: string): string {
  const p = pathTo(id).slice(1).map((n) => n.id);
  return "/" + p.join("/");
}

/** Узел по адресу: берётся последний сегмент */
export function idFromSlug(slug?: string[]): string | undefined {
  if (!slug || slug.length === 0) return "world";
  const id = slug[slug.length - 1];
  if (!byId[id]) return undefined;
  // адрес должен совпадать с настоящим путём узла
  return urlFor(id) === "/" + slug.join("/") ? id : undefined;
}

/** Все узлы, которые можно открыть как страницу (для генерации статических адресов) */
export function allOpenableIds(): string[] {
  return Object.values(byId)
    .filter((n) => n.type !== "locked")
    .map((n) => n.id);
}

export function allPlaceNames(): string[] {
  return Object.values(byId)
    .filter((n) => n.id !== "world" && (n.type === "map" || n.type === "leaf" || n.type === "scene"))
    .map((n) => n.name);
}

export function levelName(n: WorldNode): string {
  if (n.level) return n.level;
  return ({ leaf: "Место", scene: "Локация", interior: "Дом", locked: "Дом" } as Record<string, string>)[n.type] ||
    (n.id === "world" ? "Мир" : "Регион");
}

/* ---------- слои карты ---------- */

export const MAP_ASPECT = MAP_CANVAS.w / MAP_CANVAS.h;
const layerById = Object.fromEntries(MAP_LAYERS.map((l, i) => [l.id, { ...l, z: i }]));
export const getLayer = (id?: string) => (id ? layerById[id] : undefined);

/** Куда смотреть камере на этом узле карты */
export function viewOf(n: WorldNode): View {
  if (n.view) return n.view;
  const l = getLayer(n.layer);
  if (l) {
    const s = Math.min(4, Math.max(1.6, Math.min(78 / l.w, 78 / l.h)));
    return { x: l.x + l.w / 2, y: l.y + l.h / 2, s };
  }
  return { x: n.at?.x ?? 50, y: n.at?.y ?? 50, s: 3.4 };
}

/** Слой, в который «смотрит» узел: свой или ближайшего предка */
export function focusLayerOf(id: string): string | undefined {
  const p = pathTo(id);
  for (let i = p.length - 1; i >= 0; i--) if (p[i].layer) return p[i].layer;
  return undefined;
}
