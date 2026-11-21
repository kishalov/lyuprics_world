/* =====================================================================
   ФОРМАТ ЭНЦИКЛОПЕДИИ: типы, цвета, значки, проверка.
   Данные — в encyclopedia.json, доступ к ним — через encyclopedia.ts.
   Этот файл не тянет сами данные, поэтому его спокойно импортирует редактор.

     раздел:   id, name, lead (строка на плашке), forms (1 / 2 / 5: «персонаж,
               персонажа, персонажей»), icon (ключ из ICONS), color (ключ из PALETTE),
               whereLabel (как подписать поле where у его карточек: «Где живёт»)
     карточка: id (латиница, уникальный), section (id раздела), name, kind (подпись
               над названием), text (см. ниже), image ("/encyclopedia/имя.webp"),
               map (id места из world.ts — если карточка сама описывает это место),
               where (где живёт / растёт / встречается: ["map:kruzhye", "card:pitychiy-les"]).
               Старое поле fact само переезжает в text.

   Разметка описания (text):
     абзацы         — через пустую строку
     [[id]]         — ссылка на карточку, в тексте её название
     [[id|слова]]   — ссылка на карточку, в тексте «слова» (нужный падеж: [[shushin|Шушиня]])
     > текст        — абзац-примечание в жёлтой рамке
     > Заголовок: … — примечание с заголовком («Интересный факт: …»)
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
  /** подпись поля «где» у карточек раздела: «Где живёт», «Где растёт» */
  whereLabel?: string;
}

export const DEFAULT_WHERE_LABEL = "Где встречается";

/** Ссылка на место: "map:id-места-на-карте" или "card:id-карточки" */
export type WhereRef = string;
export const WHERE_RE = /^(map|card):[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const parseWhere = (w: WhereRef) => {
  const i = w.indexOf(":");
  return { kind: w.slice(0, i) as "map" | "card", id: w.slice(i + 1) };
};

export interface Entry {
  id: string;
  section: SectionId;
  name: string;
  kind?: string;
  text: string;
  fact?: string;
  image?: string;
  /** карточка сама описывает это место на карте */
  map?: string;
  /** где живёт / растёт / встречается — места на карте и другие карточки */
  where?: WhereRef[];
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
    const out: Section = {
      id: str(s.id),
      name: str(s.name),
      lead: str(s.lead),
      forms: [str(f[0]), str(f[1]), str(f[2])],
      icon: str(s.icon) as IconKey,
      color: str(s.color) as ColorKey,
    };
    const whereLabel = opt(s.whereLabel);
    if (whereLabel) out.whereLabel = whereLabel;
    return out;
  });
  const entries: Entry[] = o.entries.map((raw) => {
    const e = (raw || {}) as Record<string, unknown>;
    const kind = opt(e.kind), fact = opt(e.fact), image = opt(e.image), map = opt(e.map);
    // старое поле «Интересный факт» становится примечанием в конце описания
    const text = [str(e.text), fact ? `> Интересный факт: ${fact.replace(/\n+/g, " ")}` : ""].filter(Boolean).join("\n\n");
    const out: Entry = { id: str(e.id), section: str(e.section), name: str(e.name), text };
    if (kind) out.kind = kind;
    if (image) out.image = image;
    if (map) out.map = map;
    const where = [...new Set((Array.isArray(e.where) ? e.where : []).map(str).filter((w) => WHERE_RE.test(w)))];
    if (where.length) out.where = where;
    return out;
  });
  return { sections, entries };
}

/* ---------- ссылки: на что угодно в энциклопедии и на сайте ---------- */

/**
 * На что можно сослаться из описания. Новый тип (например, «события»):
 * добавьте его сюда и в buildRefs ниже — редактор и сайт подхватят сами.
 */
export const LINK_KINDS = {
  card: "Карточки",
  section: "Разделы энциклопедии",
  map: "Места на карте",
  page: "Страницы сайта",
} as const;
export type LinkKind = keyof typeof LINK_KINDS;

/** Страницы сайта, на которые можно сослаться: [[page:encyclopedia|энциклопедию]] */
export const PAGES: Record<string, { name: string; url: string }> = {
  home: { name: "Главная", url: "/" },
  encyclopedia: { name: "Энциклопедия", url: "/encyclopedia" },
  map: { name: "Карта мира", url: "/map" },
};

/** Ключ цели ссылки: "card:vkusnika", "section:flora", "map:kruzhye", "page:home" */
export type RefKey = string;
export const refKey = (kind: string, id: string): RefKey => `${kind}:${id}`;
export const splitRef = (key: RefKey) => {
  const i = key.indexOf(":");
  return { kind: key.slice(0, i), id: key.slice(i + 1) };
};

/** Куда ведут ссылки: название, адрес и тип каждой цели */
export type Refs = Record<RefKey, { name: string; url: string; kind: LinkKind; hint?: string }>;

/** Все цели ссылок. places — места карты (их знает только сайт, не этот файл) */
export function buildRefs(d: EncyclopediaData, places: { id: string; name: string; url: string; hint?: string }[] = []): Refs {
  const refs: Refs = {};
  for (const s of d.sections) refs[refKey("section", s.id)] = { kind: "section", name: s.name || "Без названия", url: `/encyclopedia/${s.id}` };
  for (const e of d.entries) {
    const sec = d.sections.find((s) => s.id === e.section);
    refs[refKey("card", e.id)] = { kind: "card", name: e.name || "Без названия", url: `/encyclopedia/${e.section}#${e.id}`, hint: sec?.name };
  }
  for (const p of places) refs[refKey("map", p.id)] = { kind: "map", name: p.name, url: p.url, hint: p.hint };
  for (const [id, pg] of Object.entries(PAGES)) refs[refKey("page", id)] = { kind: "page", ...pg };
  return refs;
}

// [[id]] и [[id|слова]] — карточка; [[тип:id]] и [[тип:id|слова]] — всё остальное
const LINK_RE = /\[\[(?:([a-z]+):)?([a-z0-9-]+)(?:\|([^\]\n]*))?\]\]/g;
const keyOf = (kind: string | undefined, id: string) => refKey(kind || "card", id);

/** Как записать ссылку в тексте; у карточек — коротко, без «card:» */
export function linkMarkup(key: RefKey, label?: string): string {
  const { kind, id } = splitRef(key);
  return `[[${kind === "card" ? id : key}${label !== undefined && label !== "" ? "|" + label : ""}]]`;
}

export type Inline = { t: "text"; s: string } | { t: "link"; ref: RefKey; label?: string };
export type Block = { t: "p"; text: string } | { t: "note"; title?: string; text: string };

/** Текст абзаца → куски текста и ссылки */
export function parseInline(s: string): Inline[] {
  const out: Inline[] = [];
  let last = 0;
  for (const m of s.matchAll(LINK_RE)) {
    if (m.index! > last) out.push({ t: "text", s: s.slice(last, m.index) });
    out.push({ t: "link", ref: keyOf(m[1], m[2]), label: m[3]?.trim() || undefined });
    last = m.index! + m[0].length;
  }
  if (last < s.length) out.push({ t: "text", s: s.slice(last) });
  return out;
}

/** Описание → абзацы и примечания (абзац, который начинается с «>») */
export function parseBlocks(text: string): Block[] {
  return text
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean)
    .map((b): Block => {
      if (!b.startsWith(">")) return { t: "p", text: b };
      const body = b
        .split("\n")
        .map((l) => l.replace(/^\s*>\s?/, ""))
        .join("\n")
        .trim();
      const m = body.match(/^([^:\n[\]]{1,40}):\s+([\s\S]+)$/);
      return m ? { t: "note", title: m[1].trim(), text: m[2] } : { t: "note", text: body };
    });
}

/** Название цели ссылки по ключу */
type NameOf = (key: RefKey) => string | undefined;

const blockPlain = (b: Block, nameOf: NameOf) => {
  const inner = parseInline(b.text)
    .map((x) => (x.t === "text" ? x.s : x.label || nameOf(x.ref) || splitRef(x.ref).id))
    .join("");
  return b.t === "note" && b.title ? `${b.title}: ${inner}` : inner;
};

/** Описание без разметки: ссылки → слова, примечания → «Заголовок: текст» */
export const plainText = (text: string, nameOf: NameOf) =>
  parseBlocks(text)
    .map((b) => blockPlain(b, nameOf))
    .join("\n\n");

/** Первый обычный абзац без разметки — для превью карточки */
export function firstParagraph(text: string, nameOf: NameOf): string {
  const blocks = parseBlocks(text);
  const b = blocks.find((x) => x.t === "p") || blocks[0];
  return b ? blockPlain(b, nameOf) : "";
}

/**
 * Ссылки и «где», которые ведут в никуда.
 * places — id мест карты; если не переданы, ссылки на карту не проверяются.
 */
export function linkProblems(d: EncyclopediaData, places?: Set<string>): string[] {
  const cards = new Set(d.entries.map((e) => e.id));
  const sections = new Set(d.sections.map((s) => s.id));
  const exists = (kind: string, id: string) =>
    kind === "card" ? cards.has(id) : kind === "section" ? sections.has(id) : kind === "page" ? id in PAGES : kind === "map" ? !places || places.has(id) : false;
  const out: string[] = [];
  for (const e of d.entries) {
    const who = `Карточка «${e.name || "без названия"}»`;
    for (const m of e.text.matchAll(LINK_RE)) {
      const kind = m[1] || "card";
      if (!(kind in LINK_KINDS)) out.push(`${who}: непонятная ссылка «${m[0]}»`);
      else if (!exists(kind, m[2])) out.push(`${who}: ссылка «${m[3] || m[2]}» ведёт в никуда (${kind}:${m[2]})`);
    }
    for (const w of e.where || []) {
      const { kind, id } = parseWhere(w);
      if (!exists(kind, id)) out.push(`${who}: в поле «где» указано то, чего нет (${w})`);
      if (kind === "card" && id === e.id) out.push(`${who}: в поле «где» указана она сама`);
    }
  }
  return out;
}

/** Поменялся адрес цели (карточки, раздела…) — чиним ссылки на неё */
export const renameLinks = (text: string, from: RefKey, to: RefKey) =>
  text.replace(LINK_RE, (all, kind: string | undefined, id: string, label?: string) => (keyOf(kind, id) === from ? linkMarkup(to, label) : all));

/** Цель удалили — ссылки на неё превращаются в обычный текст */
export const unlink = (text: string, key: RefKey, name: string) =>
  text.replace(LINK_RE, (all, kind: string | undefined, id: string, label?: string) => (keyOf(kind, id) === key ? label?.trim() || name : all));

/** Есть ли в тексте ссылка на эту цель */
export const mentions = (text: string, key: RefKey) => [...text.matchAll(LINK_RE)].some((m) => keyOf(m[1], m[2]) === key);

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
