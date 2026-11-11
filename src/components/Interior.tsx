"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Npc } from "@/data/npcs";
import { figureInner, roomInner } from "@/art/rooms";

export type ChatMsg = { who: "me" | "npc"; text: string };

// Переписка живёт, пока открыта вкладка: можно выйти из дома и вернуться.
const chats = new Map<string, ChatMsg[]>();

export default function Interior({ npcId, npc, onLeave }: { npcId: string; npc: Npc; onLeave: () => void }) {
  const [log, setLog] = useState<ChatMsg[]>(() => chats.get(npcId) || [{ who: "npc", text: npc.hello }]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const logRef = useRef<HTMLDivElement>(null);

  const room = useMemo(() => roomInner(npc), [npc]);
  const figure = useMemo(() => figureInner(npc.look), [npc]);

  useEffect(() => {
    chats.set(npcId, log);
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [log, npcId, typing]);

  async function say(text: string) {
    if (typing || !text.trim()) return;
    const history: ChatMsg[] = [...log, { who: "me", text: text.trim() }];
    setLog(history);
    setTyping(true);
    let answer = "";
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ npcId, history: history.slice(-14) }),
      });
      const data = await r.json();
      answer = (data.text || "").trim();
    } catch {
      /* сеть недоступна — ответим заготовкой ниже */
    }
    if (!answer) answer = npc.fallback[history.length % npc.fallback.length] || "…";
    setLog([...history, { who: "npc", text: answer }]);
    setTyping(false);
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
          {npc.quick.map((q) => (
            <button key={q} type="button" onClick={() => say(q)}>
              {q}
            </button>
          ))}
        </div>
        <form
          id="say"
          autoComplete="off"
          onSubmit={(e) => {
            e.preventDefault();
            const v = input;
            setInput("");
            say(v);
          }}
        >
          <input id="msg" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Скажите что-нибудь…" maxLength={400} />
          <button id="send" disabled={typing}>
            Сказать
          </button>
        </form>
      </div>
    </>
  );
}
