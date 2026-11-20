import Link from "next/link";
import { SECTIONS, entriesOf, plural, secStyle } from "@/data/encyclopedia";
import { SectionIcon } from "@/components/site/Icons";
import { pageMeta } from "@/lib/meta";

export const metadata = pageMeta({
  title: "Энциклопедия",
  description: "Энциклопедия вселенной люприков: персонажи, локации, флора, фауна и вещички — с описаниями и картинками.",
  path: "/encyclopedia",
});

export default function EncyclopediaHome() {
  return (
    <>
      <div className="page-title">
        <h1>Энциклопедия</h1>
        <p>Всё о мире люприков: кто здесь живёт, что растёт и какие вещички можно найти.</p>
      </div>

      <ul className="sections">
        {SECTIONS.map((s) => {
          const n = entriesOf(s.id).length;
          return (
            <li key={s.id}>
              <Link href={`/encyclopedia/${s.id}`} className="section-tile" style={secStyle(s)}>
                <span className="section-ico">
                  <SectionIcon icon={s.icon} />
                </span>
                <span className="section-text">
                  <b>{s.name}</b>
                  <span>{s.lead}</span>
                  <small>{n ? `${n} ${plural(n, s.forms)}` : "скоро появятся"}</small>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
