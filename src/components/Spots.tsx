"use client";

import type { WorldNode } from "@/data/world";

/**
 * Точки для детей узла.
 * У места со слоем (layer) — подпись; нажимается и подпись, и сам рисунок на карте.
 * У остальных — кольцо с подсказкой при наведении.
 */
export default function Spots({
  node,
  hot,
  setHot,
  onOpen,
}: {
  node: WorldNode;
  hot: string | null;
  setHot: (id: string | null) => void;
  onOpen: (id: string) => void;
}) {
  const kids = node.children || [];
  return (
    <div className="hs">
      {kids.map((c, i) => {
        if (!c.at) return null;
        const style = { left: c.at.x + "%", top: c.at.y + "%", ["--i" as string]: i };
        const stop = (e: React.MouseEvent) => e.stopPropagation();

        if (c.layer) {
          return (
            <button
              key={c.id}
              className={"place-label" + (hot === c.id ? " hot" : "")}
              style={style}
              onMouseEnter={() => setHot(c.id)}
              onMouseLeave={() => setHot(null)}
              onClick={(e) => {
                stop(e);
                onOpen(c.id);
              }}
            >
              {c.name}
            </button>
          );
        }

        const sub = c.sub || (c.type === "leaf" ? "пока в тумане" : c.type === "map" ? "нажмите, чтобы приблизить" : "");
        return (
          <button
            key={c.id}
            className={"spot" + (c.type === "locked" ? " locked" : "")}
            style={{ ...style, width: (c.at.r || 3) * 2 + "%" }}
            aria-label={c.name}
            onClick={(e) => {
              stop(e);
              onOpen(c.id);
            }}
          >
            <svg viewBox="-50 -50 100 100">
              <circle className="halo" r="50" />
              <circle className="pulse" r="9" />
              <circle className="ring" r="47" vectorEffect="non-scaling-stroke" />
            </svg>
            <span className="tag">
              {c.name}
              {sub && <small>{sub}</small>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
