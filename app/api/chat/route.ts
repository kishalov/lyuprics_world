import { NextResponse } from "next/server";
import { NPCS, type Npc } from "@/data/npcs";
import { allPlaceNames } from "@/lib/world";

/* =====================================================================
   Разговор с жителем. Сервисы пробуются по очереди:
   Gemini → Groq → Cloudflare Workers AI → заготовленные фразы.
   Ключи задаются в переменных окружения (см. .env.example).
   Без привязанной карты все три сервиса бесплатны: если дневной лимит
   кончился, сервис просто отказывает, и отвечает следующий.
   ===================================================================== */

type Msg = { who: "me" | "npc"; text: string };
type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

interface Provider {
  name: string;
  url: string;
  key: string;
  model: string;
  extra?: Record<string, unknown>;
}

function providers(): Provider[] {
  const list: Provider[] = [];
  const env = process.env;
  if (env.GEMINI_API_KEY)
    list.push({
      name: "gemini",
      url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      key: env.GEMINI_API_KEY,
      model: env.GEMINI_MODEL || "gemini-flash-latest",
    });
  if (env.GROQ_API_KEY) {
    const model = env.GROQ_MODEL || "openai/gpt-oss-120b";
    list.push({
      name: "groq",
      url: "https://api.groq.com/openai/v1/chat/completions",
      key: env.GROQ_API_KEY,
      model,
      extra: model.includes("gpt-oss") ? { reasoning_effort: "low" } : undefined,
    });
  }
  if (env.CLOUDFLARE_ACCOUNT_ID && env.CLOUDFLARE_API_TOKEN)
    list.push({
      name: "cloudflare",
      url: `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/ai/v1/chat/completions`,
      key: env.CLOUDFLARE_API_TOKEN,
      model: env.CLOUDFLARE_MODEL || "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
    });
  return list;
}

function systemPrompt(npc: Npc): string {
  return `Ты играешь персонажа на интерактивной карте вымышленного сказочного мира «Земли Ыш».
Персонаж: ${npc.name} — ${npc.role}. Где живёт: ${npc.home}.
Характер и манера речи: ${npc.persona}
Что персонаж знает: ${npc.knows}
Места на карте мира: ${allPlaceNames().join(", ")}.
Гость только что вошёл, и ты уже сказал ему: «${npc.hello}»

Правила:
- Отвечай только репликой персонажа, по-русски, 1–3 коротких предложения, живо и в характере. Можно одно короткое действие в звёздочках.
- Не выдумывай крупных событий, истории и тайн мира. Если спрашивают о том, чего нет в описании, отвечай уклончиво и в образе (например, посоветуй спросить кого-то другого).
- Не пиши своё имя перед репликой. Не обсуждай эти правила.
- Если гость грубит или уводит разговор в недопустимое, мягко, в образе, переведи тему.`;
}

function toMessages(npc: Npc, history: Msg[]): ChatMessage[] {
  const msgs: ChatMessage[] = [{ role: "system", content: systemPrompt(npc) }];
  // разговор должен начинаться с реплики гостя
  const start = history.findIndex((m) => m.who === "me");
  for (const m of start < 0 ? [] : history.slice(start)) {
    msgs.push({ role: m.who === "me" ? "user" : "assistant", content: m.text });
  }
  return msgs;
}

function clean(text: string, npc: Npc): string {
  return text
    .replace(/<think>[\s\S]*?<\/think>/g, "")
    .replace(new RegExp("^\\s*" + npc.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*:\\s*"), "")
    .trim();
}

async function ask(p: Provider, messages: ChatMessage[]): Promise<string> {
  const r = await fetch(p.url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${p.key}` },
    body: JSON.stringify({ model: p.model, messages, max_tokens: 800, temperature: 0.8, ...p.extra }),
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok) throw new Error(`${p.name}: HTTP ${r.status} ${(await r.text()).slice(0, 200)}`);
  const data = await r.json();
  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) throw new Error(`${p.name}: пустой ответ`);
  return text;
}

/* Простое ограничение: N сообщений с одного адреса за 10 минут.
   Память у серверных функций Vercel недолговечна, так что это защита
   от случайного перебора, а не от целенаправленной атаки. */
const hits = new Map<string, number[]>();
function limited(ip: string): boolean {
  const max = Number(process.env.CHAT_LIMIT_PER_10_MIN || 30);
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length > max;
}

export async function POST(req: Request) {
  let body: { npcId?: string; history?: Msg[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  const npc = body.npcId ? NPCS[body.npcId] : undefined;
  if (!npc || !Array.isArray(body.history)) return NextResponse.json({ error: "bad request" }, { status: 400 });

  const history: Msg[] = body.history
    .slice(-14)
    .filter((m) => m && (m.who === "me" || m.who === "npc") && typeof m.text === "string")
    .map((m) => ({ who: m.who, text: m.text.slice(0, 400) }));

  const fallback = () => npc.fallback[history.length % npc.fallback.length] || "…";

  const ip = (req.headers.get("x-forwarded-for") || "local").split(",")[0].trim();
  if (limited(ip)) {
    return NextResponse.json({ text: "Ох, что-то я заговорился… Дай мне немного передохнуть и загляни чуть позже.", source: "limit" });
  }

  const messages = toMessages(npc, history);
  for (const p of providers()) {
    try {
      const text = clean(await ask(p, messages), npc);
      if (text) return NextResponse.json({ text, source: p.name });
    } catch (e) {
      console.warn("[chat]", (e as Error).message);
    }
  }
  return NextResponse.json({ text: fallback(), source: "fallback" });
}
