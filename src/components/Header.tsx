"use client";

import { pathTo, urlFor } from "@/lib/world";

export default function Header({ currentId, onGo, onBack }: { currentId: string; onGo: (id: string) => void; onBack: () => void }) {
  const path = pathTo(currentId);
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
    </header>
  );
}
