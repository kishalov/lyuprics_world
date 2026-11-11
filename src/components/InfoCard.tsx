"use client";

import type { WorldNode } from "@/data/world";
import { levelName } from "@/lib/world";

export type CardData = { node: WorldNode; fog?: boolean };

export default function InfoCard({ data }: { data: CardData | null }) {
  if (!data) return <aside id="card" className="hide" />;
  const n = data.node;
  const locked = n.type === "locked";
  const fog = data.fog || n.type === "leaf";
  const desc = locked ? "Здесь пока никто не живёт. Добавьте жителя в npcs.ts и поменяйте тип дома на interior — дверь откроется." : n.desc;
  return (
    <aside id="card" key={n.id}>
      <div className="lvl">{levelName(n)}</div>
      <h2>{n.name}</h2>
      {fog && !desc && (
        <div className="fog">
          <svg width="34" height="22" viewBox="0 0 34 22">
            <path d="M2 8 q6-6 12 0 t12 0 M6 15 q6-6 12 0 t12 0" fill="none" stroke="#7a5546" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span>Туман ещё не рассеялся. Здесь появятся свои места, жители и история.</span>
        </div>
      )}
      {desc && <p>{desc}</p>}
      {!locked && n.children && n.children.length > 0 && <p className="hint">Отмеченные кольцами места можно открыть.</p>}
    </aside>
  );
}
