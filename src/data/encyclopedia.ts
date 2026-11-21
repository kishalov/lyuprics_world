/* =====================================================================
   ЭНЦИКЛОПЕДИЯ — данные для страниц сайта.

   Разделы и карточки лежат в encyclopedia.json. Удобнее всего менять их
   через редактор на сайте: /editor (см. README). Формат и разметка описаний
   (ссылки на карточки, примечания) — в encyclopedia-schema.ts.
   ===================================================================== */

import data from "./encyclopedia.json";
import {
  firstParagraph,
  normalizeData,
  plainText,
  validateData,
  type Entry,
  type Refs,
  type Section,
  type SectionId,
} from "./encyclopedia-schema";

export * from "./encyclopedia-schema";

const DATA = normalizeData(data);
{
  const errors = validateData(DATA);
  if (errors.length) throw new Error("encyclopedia.json: " + errors.join("; "));
}

export const SECTIONS: Section[] = DATA.sections;
export const ENTRIES: Entry[] = DATA.entries;

export const getSection = (id: string) => SECTIONS.find((s) => s.id === id);
export const getEntry = (id: string) => ENTRIES.find((e) => e.id === id);
export const entriesOf = (section: SectionId) => ENTRIES.filter((e) => e.section === section);
export const entryUrl = (e: Entry) => `/encyclopedia/${e.section}#${e.id}`;
/** Карточка энциклопедии, привязанная к месту на карте */
export const entryForPlace = (placeId: string) => ENTRIES.find((e) => e.map === placeId);

const nameOf = (id: string) => getEntry(id)?.name;
/** Описание карточки без разметки */
export const entryPlain = (e: Entry) => plainText(e.text, nameOf);
/** Первый абзац без разметки */
export const entryLead = (e: Entry) => firstParagraph(e.text, nameOf);

/** Куда ведут ссылки [[id]] в описаниях: название и адрес каждой карточки */
export const allRefs = (): Refs => Object.fromEntries(ENTRIES.map((e) => [e.id, { name: e.name, url: entryUrl(e) }]));
