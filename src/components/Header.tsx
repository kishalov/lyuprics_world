"use client";

import { pathTo, urlFor, levelName } from "@/lib/world";

const LEVELS = ["Мир", "Регион", "Локация", "Дом"];

export default function Header({ currentId, onGo, onBack }: { currentId: string; onGo: (id: string) => void; onBack: () => void }) {
  const path = pathTo(currentId);
  const last = path[path.length - 1];
  return (
    <header>
      <button id="back" title="Назад (Esc)" aria-label="Назад" hidden={path.length < 2} onClick={onBack}>
        <svg width="18" height="18" viewBox="0 0 20 20">
          <path d="M13 3 L6 10 L13 17" fill="none" stroke="#4b2b23" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <nav id="crumbs">
        {path.map((n, i) =>
          i === path.length - 1 ? (
            <b key={n.id}>{n.name}</b>
          ) : (
            <span key={n.id} style={{ display: "contents" }}>
              <a
                href={urlFor(n.id)}
                onClick={(e) => {
                  e.preventDefault();
                  onGo(n.id);
                }}
              >
                {n.name}
              </a>
              <i>›</i>
            </span>
          ),
        )}
      </nav>
      <div id="depth">
        {LEVELS.map((l, i) => (
          <span key={l} className={i < path.length ? "on" : ""} title={l} />
        ))}
        &nbsp;{last ? levelName(last) : ""}
      </div>
    </header>
  );
}
