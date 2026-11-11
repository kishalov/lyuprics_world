"use client";

import { useState } from "react";
import type { WorldNode } from "@/data/world";

/** Кольца-точки (и зоны регионов) для детей узла. Координаты — в % полотна. */
export default function Spots({ node, withRegions, onOpen }: { node: WorldNode; withRegions?: boolean; onOpen: (id: string) => void }) {
  const [hot, setHot] = useState<string | null>(null);
  const kids = node.children || [];
  return (
    <>
      {withRegions && (
        <svg id="regions" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.2" />
            </filter>
          </defs>
          <g filter="url(#soft)">
            {kids
              .filter((c) => c.region && c.poly)
              .map((c) => (
                <path
                  key={c.id}
                  className={hot === c.id ? "hot" : ""}
                  d={"M" + c.poly!.trim().split(/\s+/).join(" L") + "Z"}
                  onMouseEnter={() => setHot(c.id)}
                  onMouseLeave={() => setHot(null)}
                  onClick={() => onOpen(c.id)}
                />
              ))}
          </g>
        </svg>
      )}
      <div className="hs">
        {kids.map((c, i) => {
          const sub = c.sub || (c.type === "leaf" ? "пока в тумане" : c.type === "map" ? "нажмите, чтобы приблизить" : "");
          return (
            <button
              key={c.id}
              className={"spot" + (c.region ? " region" : "") + (c.type === "locked" ? " locked" : "") + (hot === c.id ? " hot" : "")}
              style={{ left: c.at!.x + "%", top: c.at!.y + "%", width: c.at!.r * 2 + "%", ["--i" as string]: i }}
              aria-label={c.name}
              onMouseEnter={() => c.region && setHot(c.id)}
              onMouseLeave={() => c.region && setHot(null)}
              onClick={() => onOpen(c.id)}
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
    </>
  );
}
