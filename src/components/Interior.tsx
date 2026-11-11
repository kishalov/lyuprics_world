"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Npc } from "@/data/npcs";
import { figureInner, roomInner } from "@/art/rooms";

export type ChatMsg = { who: "me" | "npc"; text: string };

// Разговор живёт, пока открыта вкладка: можно выйти из дома и вернуться.
const chats = new Map<string, ChatMsg[]>();

export default function Interior({ npcId, npc, onLeave }: { npcId: string; npc: Npc; onLeave: () => void }) {
  const [log, setLog] = useState<ChatMsg[]>(() => chats.get(npcId) || [{ who: "npc", text: npc.hello }]);
  const [typing, setTyping] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  const room = useMemo(() => roomInner(npc), [npc]);
  const figure = useMemo(() => figureInner(npc.look), [npc]);
  const asked = new Set(log.filter((m) => m.who === "me").map((m) => m.text));

  useEffect(() => {
    chats.set(npcId, log);
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [log, npcId, typing]);

  function say(q: string, a: string) {
    if (typing) return;
    setLog((l) => [...l, { who: "me", text: q }]);
    setTyping(true);
    // короткая пауза, будто житель думает
    setTimeout(() => {
      setLog((l) => [...l, { who: "npc", text: a }]);
      setTyping(false);
    }, 500 + Math.min(a.length * 8, 900));
  }

  return (
    <>
      <div id="room">
        <svg viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
          {npc.roomImage ? (
            <image href={npc.roomImage} width="1200" height="800" preserveAspectRatio="xMidYMid slice" />
          ) : (
            <g dangerouslySetInnerHTML={{ __html: room }} />
          )}
          <g
            className={"npc-fig" + (typing ? " talk" : "")}
            transform="translate(560 700) scale(1.05)"
            dangerouslySetInnerHTML={{ __html: figure }}
          />
        </svg>
        <button id="leave" onClick={onLeave}>
          ← Выйти на улицу
        </button>
      </div>
      <div id="chat">
        <div className="who">
          <h3>{npc.name}</h3>
          <div>{npc.role}</div>
        </div>
        <div id="log" ref={logRef}>
          {log.map((m, i) => (
            <div key={i} className={"msg " + m.who}>
              {m.text}
            </div>
          ))}
          {typing && <div className="msg npc typing">{npc.name} задумался…</div>}
        </div>
        <div id="quick">
          {npc.talk.map(({ q, a }) => (
            <button key={q} type="button" className={asked.has(q) ? "asked" : undefined} disabled={typing} onClick={() => say(q, a)}>
              {q}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
