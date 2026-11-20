import Link from "next/link";
import { SECTIONS } from "@/data/encyclopedia";
import { SiteHeader } from "@/components/site/SiteNav";
import { BookIcon, MapIcon, SectionIcon } from "@/components/site/Icons";

export default function Home() {
  return (
    <div className="site">
      <SiteHeader />
      <main className="site-main home">
        <div className="hero">
          <h1>Люприки</h1>
          <p>Путеводитель по миру люприков: где что находится и кто есть кто.</p>
        </div>

        <div className="doors">
          <Link href="/map" className="door door-map">
            <span className="door-pic">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/map-cover.webp" alt="" />
            </span>
            <span className="door-text">
              <span className="door-title">
                <MapIcon />
                Карта мира
              </span>
              <span>Приближайте места, заглядывайте в дома и говорите с жителями.</span>
            </span>
          </Link>

          <div className="door door-wiki">
            <Link href="/encyclopedia" className="door-cover">
              <span className="door-title">
                <BookIcon />
                Энциклопедия
              </span>
              <span>Персонажи, локации, флора, фауна и вещички.</span>
            </Link>
            <ul className="door-sections">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <Link href={`/encyclopedia/${s.id}`} data-sec={s.id}>
                    <SectionIcon id={s.id} />
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
