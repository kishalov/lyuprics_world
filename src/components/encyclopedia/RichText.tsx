import Link from "next/link";
import { parseBlocks, parseInline, type Refs } from "@/data/encyclopedia-schema";

/**
 * Описание карточки: абзацы, ссылки на другие карточки и примечания в жёлтой рамке.
 * onLink — перехватить нажатие на ссылку (например, открыть карточку на этой же странице).
 */
export default function RichText({
  text,
  refs,
  onLink,
}: {
  text: string;
  refs: Refs;
  onLink?: (id: string, ev: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
  const inline = (s: string) =>
    parseInline(s).map((x, i) => {
      if (x.t === "text") return x.s;
      const ref = refs[x.id];
      const label = x.label || ref?.name || x.id;
      if (!ref) return <span key={i}>{label}</span>; // карточки уже нет — просто текст
      return (
        <Link key={i} className="xref" href={ref.url} title={ref.name} onClick={onLink ? (ev) => onLink(x.id, ev) : undefined}>
          {label}
        </Link>
      );
    });

  return (
    <>
      {parseBlocks(text).map((b, i) =>
        b.t === "note" ? (
          <aside key={i} className="note">
            {b.title && <b>{b.title}</b>}
            {inline(b.text)}
          </aside>
        ) : (
          <p key={i}>{inline(b.text)}</p>
        ),
      )}
    </>
  );
}
