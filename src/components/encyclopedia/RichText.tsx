import Link from "next/link";
import { parseBlocks, parseInline, splitRef, type RefKey, type Refs } from "@/data/encyclopedia-schema";

/**
 * Описание карточки: абзацы, ссылки (на карточки, разделы, места карты, страницы)
 * и примечания в жёлтой рамке.
 * onLink — перехватить нажатие на ссылку (например, открыть карточку на этой же странице).
 */
export default function RichText({
  text,
  refs,
  onLink,
}: {
  text: string;
  refs: Refs;
  onLink?: (ref: RefKey, ev: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
  const inline = (s: string) =>
    parseInline(s).map((x, i) => {
      if (x.t === "text") return x.s;
      const target = refs[x.ref];
      const label = x.label || target?.name || splitRef(x.ref).id;
      if (!target) return <span key={i}>{label}</span>; // цели уже нет — просто текст
      return (
        <Link
          key={i}
          className={"xref " + target.kind}
          href={target.url}
          title={target.hint ? `${target.name} · ${target.hint}` : target.name}
          onClick={onLink ? (ev) => onLink(x.ref, ev) : undefined}
        >
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
