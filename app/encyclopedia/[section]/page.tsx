import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SECTIONS, allRefs, entriesOf, getSection, secStyle } from "@/data/encyclopedia";
import { getNode, urlFor } from "@/lib/world";
import { SectionIcon } from "@/components/site/Icons";
import { pageMeta } from "@/lib/meta";
import EntryGrid, { type EntryView } from "@/components/encyclopedia/EntryGrid";

type Props = { params: Promise<{ section: string }> };

export function generateStaticParams() {
  return SECTIONS.map((s) => ({ section: s.id }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const s = getSection((await params).section);
  if (!s) return {};
  const names = entriesOf(s.id).map((e) => e.name);
  const list = names.length ? ` В разделе: ${names.slice(0, 6).join(", ")}${names.length > 6 ? " и другие" : ""}.` : "";
  return pageMeta({
    title: `${s.name} — энциклопедия`,
    description: `${s.name} вселенной люприков. ${s.lead}${list}`,
    path: `/encyclopedia/${s.id}`,
  });
}

export default async function SectionPage({ params }: Props) {
  const section = getSection((await params).section);
  if (!section) notFound();

  // адрес на карте считаем здесь, чтобы не тащить карту мира в браузер
  const entries: EntryView[] = entriesOf(section.id).map((e) => ({
    ...e,
    mapUrl: e.map && getNode(e.map) ? urlFor(e.map) : undefined,
  }));

  return (
    <div style={secStyle(section)}>
      <nav className="wiki-crumbs" aria-label="Путь">
        <Link href="/encyclopedia">Энциклопедия</Link>
        <i>›</i>
        <b>{section.name}</b>
      </nav>

      <div className="page-title with-ico">
        <span className="section-ico">
          <SectionIcon icon={section.icon} />
        </span>
        <div>
          <h1>{section.name}</h1>
          <p>{section.lead}</p>
        </div>
      </div>

      <nav className="sec-chips" aria-label="Другие разделы">
        {SECTIONS.map((s) => (
          <Link
            key={s.id}
            href={`/encyclopedia/${s.id}`}
            style={secStyle(s)}
            className={s.id === section.id ? "on" : undefined}
            aria-current={s.id === section.id ? "page" : undefined}
          >
            <SectionIcon icon={s.icon} />
            {s.name}
          </Link>
        ))}
      </nav>

      {entries.length ? (
        <EntryGrid entries={entries} sectionName={section.name} sectionIcon={section.icon} refs={allRefs()} />
      ) : (
        <div className="empty">
          <SectionIcon icon={section.icon} />
          <p>Здесь пока пусто. Скоро в разделе «{section.name}» появятся первые карточки.</p>
        </div>
      )}
    </div>
  );
}
