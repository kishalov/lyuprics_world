/* =====================================================================
   ФОРМАТ ЭНЦИКЛОПЕДИИ: типы, цвета, значки, проверка.
   Данные — в encyclopedia.json, доступ к ним — через encyclopedia.ts.
   Этот файл не тянет сами данные, поэтому его спокойно импортирует редактор.

     раздел:   id, name, lead (строка на плашке), forms (1 / 2 / 5: «персонаж,
               персонажа, персонажей»), icon (ключ из ICONS), color (ключ из PALETTE)
     карточка: id (латиница, уникальный), section (id раздела), name, kind (подпись
               над названием), text (абзацы через пустую строку), fact, image
               ("/encyclopedia/имя.webp"), map (id места из world.ts)
   ===================================================================== */

import type { CSSProperties } from "react";

/** Цвета разделов: main — заливка значка и активной кнопки, bg — фон плашек */
export const PALETTE = {
  coral: { name: "Коралловый", main: "#f19a86", bg: "#fbe1da" },
  orange: { name: "Оранжевый", main: "#f2b46b", bg: "#fce6cc" },
  yellow: { name: "Жёлтый", main: "#f6d55c", bg: "#fbf0c4" },
  olive: { name: "Оливковый", main: "#c0c47c", bg: "#ecedd2" },
  green: { name: "Зелёный", main: "#8fc27a", bg: "#dcefd2" },
  blue: { name: "Голубой", main: "#8cc5dd", bg: "#dcedf5" },
  lilac: { name: "Сиреневый", main: "#b49ad8", bg: "#e9e0f5" },
  pink: { name: "Розовый", main: "#f0a6c8", bg: "#fbe0ec" },
  gray: { name: "Серый", main: "#bdb5aa", bg: "#ece8e2" },
} as const;
export type ColorKey = keyof typeof PALETTE;

/** Значки разделов (рисунки — в src/components/site/Icons.tsx) */
export const ICONS = {
  face: "Мордочка",
  mountain: "Горы",
  berries: "Ягоды",
  bug: "Букашка",
  flask: "Колба",
  book: "Книга",
  star: "Звезда",
  house: "Домик",
  gem: "Кристалл",
} as const;
export type IconKey = keyof typeof ICONS;

export type SectionId = string;

export interface Section {
  id: SectionId;
  name: string;
  /** одна строка на плашке раздела */
  lead: string;
  /** «3 персонажа»: формы для 1, 2–4, 5+ */
  forms: [string, string, string];
  icon: IconKey;
  color: ColorKey;
}

export interface Entry {
  id: string;
  section: SectionId;
  name: string;
  kind?: string;
  text: string;
  fact?: string;
  image?: string;
  map?: string;
}

export interface EncyclopediaData {
  sections: Section[];
  entries: Entry[];
}

export const ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const IMAGE_RE = /^\/encyclopedia\/[a-z0-9][a-z0-9-]*\.(webp|jpg|jpeg|png)$/;

/** Список ошибок; пустой — всё в порядке */
export function validateData(d: EncyclopediaData): string[] {
  const errors: string[] = [];
  const secIds = new Set<string>();
  for (const s of d.sections) {
    const label = s.name.trim() || "без названия";
    if (!s.name.trim()) errors.push("У раздела нет названия");
    if (!ID_RE.test(s.id)) errors.push(`Раздел «${label}»: адрес «${s.id}» — только латиница, цифры и дефисы`);
    if (secIds.has(s.id)) errors.push(`Два раздела с адресом «${s.id}»`);
    if (!(s.icon in ICONS)) errors.push(`Раздел «${label}»: неизвестный значок`);
    if (!(s.color in PALETTE)) errors.push(`Раздел «${label}»: неизвестный цвет`);
    secIds.add(s.id);
  }
  const ids = new Set<string>();
  for (const e of d.entries) {
    const label = e.name.trim() || "без названия";
    if (!e.name.trim()) errors.push("У карточки нет названия");
    if (!ID_RE.test(e.id)) errors.push(`Карточка «${label}»: адрес «${e.id}» — только латиница, цифры и дефисы`);
    if (ids.has(e.id)) errors.push(`Две карточки с адресом «${e.id}»`);
    if (!secIds.has(e.section)) errors.push(`Карточка «${label}»: нет раздела «${e.section}»`);
    if (e.image && !IMAGE_RE.test(e.image)) errors.push(`Карточка «${label}»: странный путь к картинке`);
    ids.add(e.id);
  }
  return errors;
}

/** Приводит что угодно к аккуратным данным: только известные поля, строки без лишних пробелов */
export function normalizeData(input: unknown): EncyclopediaData {
  const o = (input || {}) as { sections?: unknown; entries?: unknown };
  if (!Array.isArray(o.sections) || !Array.isArray(o.entries)) throw new Error("Нет списков sections и entries");
  const str = (v: unknown) => (typeof v === "string" ? v.replace(/\r\n/g, "\n").trim() : "");
  const opt = (v: unknown) => str(v) || undefined;
  const sections: Section[] = o.sections.map((raw) => {
    const s = (raw || {}) as Record<string, unknown>;
    const f = Array.isArray(s.forms) ? s.forms : [];
    return {
      id: str(s.id),
      name: str(s.name),
      lead: str(s.lead),
      forms: [str(f[0]), str(f[1]), str(f[2])],
      icon: str(s.icon) as IconKey,
      color: str(s.color) as ColorKey,
    };
  });
  const entries: Entry[] = o.entries.map((raw) => {
    const e = (raw || {}) as Record<string, unknown>;
    const out: Entry = { id: str(e.id), section: str(e.section), name: str(e.name), text: str(e.text) };
    const kind = opt(e.kind), fact = opt(e.fact), image = opt(e.image), map = opt(e.map);
    if (kind) out.kind = kind;
    if (fact) out.fact = fact;
    if (image) out.image = image;
    if (map) out.map = map;
    return out;
  });
  return { sections, entries };
}

/** Как файл выглядит на диске */
export const serializeData = (d: EncyclopediaData) => JSON.stringify(d, null, 2) + "\n";

/** CSS-переменные цвета раздела: --sec и --sec-bg */
export function secStyle(s: { color: ColorKey }): CSSProperties {
  const c = PALETTE[s.color] || PALETTE.gray;
  return { "--sec": c.main, "--sec-bg": c.bg } as CSSProperties;
}

/** 1 персонаж, 2 персонажа, 5 персонажей */
export function plural(n: number, [one, few, many]: [string, string, string]): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

/* ---------- адрес из названия: «Питучий лес» → pitychiy-les ---------- */
const TR: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m",
  н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "c", ч: "ch", ш: "sh", щ: "shch",
  ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .split("")
    .map((ch) => (ch in TR ? TR[ch] : ch))
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
}
