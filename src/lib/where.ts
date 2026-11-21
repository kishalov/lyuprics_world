/* =====================================================================
   «ГДЕ» И «ЗДЕСЬ»: связь карточек с местами.

   У карточки есть поле where — где персонаж живёт, ягода растёт и т. д.
   Это места на карте ("map:kruzhye") и другие карточки ("card:pitychiy-les").
     whereOf(карточка)  → ссылки на эти места
     whoIsAt(...)       → обратно: какие карточки указали это место, по разделам
   Ссылка на место ведёт к карточке, которая его описывает (поле map), а если
   такой нет — на карту.
   ===================================================================== */

import { ENTRIES, SECTIONS, entryForPlace, entryUrl, getEntry, parseWhere, type Entry } from "@/data/encyclopedia";
import { getNode, urlFor } from "@/lib/world";

export type LinkRef = { id: string; name: string; url: string };
export type HereGroup = { section: string; items: LinkRef[] };

/** Место на карте → ссылка (на его карточку, если она есть) */
export function placeRef(placeId: string): LinkRef | undefined {
  const node = getNode(placeId);
  if (!node) return undefined;
  const card = entryForPlace(placeId);
  return card ? { id: card.id, name: node.name, url: entryUrl(card) } : { id: "", name: node.name, url: urlFor(placeId) };
}

/** Где живёт / растёт / встречается — ссылки */
export function whereOf(e: Entry): LinkRef[] {
  const out: LinkRef[] = [];
  for (const w of e.where || []) {
    const { kind, id } = parseWhere(w);
    if (kind === "card") {
      const c = getEntry(id);
      if (c) out.push({ id: c.id, name: c.name, url: entryUrl(c) });
    } else {
      const r = placeRef(id);
      if (r) out.push(r);
    }
  }
  return out;
}

/** Кто здесь живёт / что растёт: карточки, у которых в «где» указано это место или его карточка */
export function whoIsAt({ card, place }: { card?: Entry; place?: string }): HereGroup[] {
  const keys = new Set<string>();
  if (card) {
    keys.add("card:" + card.id);
    if (card.map) keys.add("map:" + card.map);
  }
  if (place) {
    keys.add("map:" + place);
    const c = entryForPlace(place);
    if (c) keys.add("card:" + c.id);
  }
  if (!keys.size) return [];
  const hits = ENTRIES.filter((x) => x.id !== card?.id && (x.where || []).some((w) => keys.has(w)));
  return SECTIONS.map((s) => ({
    section: s.name,
    items: hits.filter((x) => x.section === s.id).map((x) => ({ id: x.id, name: x.name, url: entryUrl(x) })),
  })).filter((g) => g.items.length);
}
