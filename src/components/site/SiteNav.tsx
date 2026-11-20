import Link from "next/link";
import { BookIcon, Logo, MapIcon } from "./Icons";

export type SiteSection = "map" | "encyclopedia";

/** Название сайта со ссылкой на главную */
export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="Люприки — на главную">
      <Logo />
      Люприки
    </Link>
  );
}

/**
 * Переключатель основных разделов сайта.
 * onMap — если карта уже открыта, вместо перехода плавно отдаляем её к миру.
 */
export function SiteNav({ active, onMap }: { active?: SiteSection; onMap?: () => void }) {
  return (
    <nav className="site-nav" aria-label="Разделы сайта">
      <Link
        href="/map"
        className={active === "map" ? "on" : undefined}
        aria-current={active === "map" ? "page" : undefined}
        onClick={
          onMap
            ? (e) => {
                e.preventDefault();
                onMap();
              }
            : undefined
        }
      >
        <MapIcon />
        <span>Карта</span>
      </Link>
      <Link
        href="/encyclopedia"
        className={active === "encyclopedia" ? "on" : undefined}
        aria-current={active === "encyclopedia" ? "page" : undefined}
      >
        <BookIcon />
        <span>Энциклопедия</span>
      </Link>
    </nav>
  );
}

/** Шапка обычных страниц (главная, энциклопедия) */
export function SiteHeader({ active }: { active?: SiteSection }) {
  return (
    <header className="site-head">
      <Brand />
      <SiteNav active={active} />
    </header>
  );
}
