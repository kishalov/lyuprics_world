"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { firstParagraph, type Entry, type IconKey, type Refs } from "@/data/encyclopedia-schema";
import { SectionIcon } from "@/components/site/Icons";
import RichText from "./RichText";

import type { HereGroup, LinkRef } from "@/lib/where";

export type EntryView = Entry & {
  mapUrl?: string;
  /** где живёт / растёт — ссылки */
  whereRefs: LinkRef[];
  /** кто здесь живёт / что растёт — по разделам */
  here: HereGroup[];
};

/** Картинка карточки или заглушка: первая буква и значок раздела */
export function Picture({ e, icon, big }: { e: Pick<Entry, "name" | "image">; icon: IconKey; big?: boolean }) {
  if (e.image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className="pic" src={e.image} alt={e.name} loading={big ? "eager" : "lazy"} draggable={false} />;
  }
  return (
    <div className="pic stub" aria-hidden="true">
      <span className="stub-letter">{e.name[0] || "?"}</span>
      <span className="stub-ico">
        <SectionIcon icon={icon} />
      </span>
    </div>
  );
}

/**
 * Сетка карточек. По нажатию карточка открывается крупно (полный текст, факт, ссылка на карту).
 * Открытая карточка записывается в адрес (#id), поэтому ссылкой на неё можно поделиться.
 */
export default function EntryGrid({
  entries,
  sectionName,
  sectionIcon,
  refs,
  whereLabel,
}: {
  entries: EntryView[];
  sectionName: string;
  sectionIcon: IconKey;
  /** все карточки энциклопедии — для ссылок в описаниях */
  refs: Refs;
  /** «Где живёт», «Где растёт»… */
  whereLabel: string;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const dlg = useRef<HTMLDialogElement>(null);
  const open = entries.find((e) => e.id === openId) || null;
  const nameOf = (id: string) => refs[id]?.name;

  // #id в адресе → открыть карточку (при загрузке и при смене хэша)
  useEffect(() => {
    const sync = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      setOpenId(entries.some((e) => e.id === id) ? id : null);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [entries]);

  useEffect(() => {
    const d = dlg.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const show = (id: string) => {
    window.history.replaceState(null, "", `#${id}`);
    setOpenId(id);
    dlg.current?.scrollTo({ top: 0 });
  };
  /** Ссылка на карточку этого же раздела открывает её здесь же, остальные — обычный переход */
  const stayHere = (id: string) => (ev: React.MouseEvent) => {
    if (id && entries.some((e) => e.id === id)) {
      ev.preventDefault();
      show(id);
    }
  };
  const chips = (list: LinkRef[]) =>
    list.map((r) => (
      <Link key={r.url} className="chip" href={r.url} onClick={stayHere(r.id)}>
        {r.name}
      </Link>
    ));

  const onClosed = () => {
    setOpenId(null);
    if (window.location.hash) window.history.replaceState(null, "", window.location.pathname + window.location.search);
  };

  return (
    <>
      <ul className="cards">
        {entries.map((e, i) => (
          <li key={e.id} id={e.id} style={{ "--i": i } as React.CSSProperties}>
            <a
              className="card"
              href={`#${e.id}`}
              onClick={(ev) => {
                ev.preventDefault();
                show(e.id);
              }}
            >
              <Picture e={e} icon={sectionIcon} />
              <div className="card-body">
                {e.kind && <span className="kind">{e.kind}</span>}
                <h3>{e.name}</h3>
                {e.whereRefs.length > 0 && <span className="card-where">{e.whereRefs.map((r) => r.name).join(", ")}</span>}
                <p>{firstParagraph(e.text, nameOf)}</p>
                {e.mapUrl && <span className="on-map">есть на карте</span>}
              </div>
            </a>
          </li>
        ))}
      </ul>

      <dialog
        ref={dlg}
        className="entry"
        aria-label={open?.name}
        onClose={onClosed}
        onClick={(ev) => {
          // нажатие мимо окна закрывает его
          if (ev.target === ev.currentTarget) ev.currentTarget.close();
        }}
      >
        {open && (
          <article key={open.id}>
            <button className="x" aria-label="Закрыть" onClick={() => dlg.current?.close()}>
              ×
            </button>
            <Picture e={open} icon={sectionIcon} big />
            <div className="entry-body">
              <span className="kind">{open.kind ? `${sectionName} · ${open.kind}` : sectionName}</span>
              <h2>{open.name}</h2>
              {open.whereRefs.length > 0 && (
                <div className="where">
                  <b>{whereLabel}:</b>
                  {chips(open.whereRefs)}
                </div>
              )}
              <RichText text={open.text} refs={refs} onLink={(id, ev) => stayHere(id)(ev)} />
              {open.here.length > 0 && (
                <div className="here">
                  <b>Здесь</b>
                  {open.here.map((g) => (
                    <div key={g.section} className="where">
                      <i>{g.section}:</i>
                      {chips(g.items)}
                    </div>
                  ))}
                </div>
              )}
              {open.mapUrl && (
                <Link className="to-map" href={open.mapUrl}>
                  Показать на карте →
                </Link>
              )}
            </div>
          </article>
        )}
      </dialog>
    </>
  );
}
