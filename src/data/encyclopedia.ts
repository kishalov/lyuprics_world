/* =====================================================================
   ЭНЦИКЛОПЕДИЯ — данные для страниц сайта.

   Разделы и карточки лежат в encyclopedia.json. Удобнее всего менять их
   через редактор на сайте: /editor (см. README). Формат описан
   в encyclopedia-schema.ts.
   ===================================================================== */

import data from "./encyclopedia.json";
import { validateData, type EncyclopediaData, type Entry, type Section, type SectionId } from "./encyclopedia-schema";

export * from "./encyclopedia-schema";

const DATA = data as EncyclopediaData;
{
  const errors = validateData(DATA);
  if (errors.length) throw new Error("encyclopedia.json: " + errors.join("; "));
}

export const SECTIONS: Section[] = DATA.sections;
export const ENTRIES: Entry[] = DATA.entries;

export const getSection = (id: string) => SECTIONS.find((s) => s.id === id);
export const entriesOf = (section: SectionId) => ENTRIES.filter((e) => e.section === section);
export const entryUrl = (e: Entry) => `/encyclopedia/${e.section}#${e.id}`;
/** Карточка энциклопедии, привязанная к месту на карте */
export const entryForPlace = (placeId: string) => ENTRIES.find((e) => e.map === placeId);
