"use client";

/* =====================================================================
   РЕДАКТОР ЭНЦИКЛОПЕДИИ (/editor)
   Все правки сначала копятся в браузере, кнопка «Сохранить» (или Ctrl+S)
   отправляет их разом: в файлы проекта (npm run dev) или коммитом на GitHub.
   ===================================================================== */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ICONS,
  PALETTE,
  plural,
  secStyle,
  slugify,
  validateData,
  type ColorKey,
  type EncyclopediaData,
  type Entry,
  type IconKey,
  type Section,
} from "@/data/encyclopedia-schema";
import { SectionIcon } from "@/components/site/Icons";

export type Place = { id: string; name: string };
type Mode = "local" | "github" | "off";
type Status = "loading" | "off" | "login" | "ready" | "error";
/** Картинки, выбранные в этой сессии: base64 — ещё не отправлена, url — для показа */
type Pending = Record<string, { base64?: string; url: string }>;
type Toast = { kind: "ok" | "err"; text: string };

const EMPTY: EncyclopediaData = { sections: [], entries: [] };
const MAX_BODY = 4_200_000; // Vercel принимает запросы до ~4,5 МБ

const rand = () => Math.random().toString(36).slice(2, 6);
const fileOf = (image?: string) => image?.replace(/^\/encyclopedia\//, "") || "";

function uniqueId(name: string, taken: Set<string>, fallback: string): string {
  const base = slugify(name) || fallback;
  let id = base;
  for (let i = 2; taken.has(id); i++) id = `${base}-${i}`;
  return id;
}

function swap<T>(arr: T[], i: number, j: number): T[] {
  if (i < 0 || j < 0 || i >= arr.length || j >= arr.length) return arr;
  const a = arr.slice();
  [a[i], a[j]] = [a[j], a[i]];
  return a;
}

/** Уменьшает картинку до 1600 px по большей стороне и пережимает в WebP (или JPEG, если браузер не умеет WebP) */
async function shrinkImage(file: File): Promise<{ blob: Blob; ext: string }> {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(bmp.width * k));
  c.height = Math.max(1, Math.round(bmp.height * k));
  const ctx = c.getContext("2d")!;
  ctx.drawImage(bmp, 0, 0, c.width, c.height);
  bmp.close();
  const encode = (type: string, q: number) => new Promise<Blob | null>((r) => c.toBlob(r, type, q));
  const webp = await encode("image/webp", 0.86);
  if (webp && webp.type === "image/webp") return { blob: webp, ext: "webp" };
  ctx.globalCompositeOperation = "destination-over";
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, c.width, c.height);
  const jpg = await encode("image/jpeg", 0.88);
  if (!jpg) throw new Error("Не получилось обработать картинку");
  return { blob: jpg, ext: "jpg" };
}

const toBase64 = (blob: Blob) =>
  new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result).split(",")[1] || "");
    r.onerror = () => rej(r.error);
    r.readAsDataURL(blob);
  });

/* ===================================================================== */

export default function Editor({ places }: { places: Place[] }) {
  const [status, setStatus] = useState<Status>("loading");
  const [mode, setMode] = useState<Mode>("off");
  const [needPassword, setNeedPassword] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [data, setData] = useState<EncyclopediaData>(EMPTY);
  const [savedJson, setSavedJson] = useState(JSON.stringify(EMPTY));
  const [version, setVersion] = useState("");
  const [imageBase, setImageBase] = useState("");
  const [pending, setPending] = useState<Pending>({});

  const [secId, setSecId] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  /** Новые раздел/карточка: их адрес подстраивается под название, пока его не поменяли вручную */
  const [fresh, setFresh] = useState<Set<string>>(new Set());

  /** Перетаскивание карточки на раздел в списке слева */
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropSec, setDropSec] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [problems, setProblems] = useState<string[]>([]);

  const dirty = JSON.stringify(data) !== savedJson;
  const sec = data.sections.find((s) => s.id === secId);
  const secEntries = data.entries.filter((e) => e.section === secId);
  const editing = editId ? data.entries.find((e) => e.id === editId) : undefined;

  const say = useCallback((kind: Toast["kind"], text: string) => setToast({ kind, text }), []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), toast.kind === "ok" ? 4000 : 9000);
    return () => clearTimeout(t);
  }, [toast]);

  /* ---------- загрузка и вход ---------- */

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const auth = await fetch("/api/editor/auth", { cache: "no-store" }).then((r) => r.json());
      setMode(auth.mode);
      setNeedPassword(auth.needPassword);
      if (auth.mode === "off") return setStatus("off");
      if (!auth.authorized) return setStatus("login");
      const res = await fetch("/api/editor/data", { cache: "no-store" });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || res.statusText);
      const d = j.data as EncyclopediaData;
      setData(d);
      setSavedJson(JSON.stringify(d));
      setVersion(j.version);
      setImageBase(j.imageBase || "");
      setSecId((cur) => (d.sections.some((s) => s.id === cur) ? cur : d.sections[0]?.id || ""));
      setStatus("ready");
    } catch (e) {
      setLoadError((e as Error).message);
      setStatus("error");
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const logOut = async () => {
    if (dirty && !confirm("Есть несохранённые правки. Всё равно выйти?")) return;
    await fetch("/api/editor/auth", { method: "DELETE" });
    load();
  };

  /* ---------- сохранение ---------- */

  const save = async () => {
    if (saving) return;
    const errs = validateData(data);
    setProblems(errs);
    if (errs.length) return say("err", "Не сохранено: поправьте отмеченное вверху.");
    const used = new Set(data.entries.map((e) => fileOf(e.image)).filter(Boolean));
    const images = Object.entries(pending)
      .filter(([name, p]) => p.base64 && used.has(name))
      .map(([name, p]) => ({ name, base64: p.base64! }));
    const body = JSON.stringify({ data, version, images });
    if (body.length > MAX_BODY) return say("err", "Слишком много новых картинок за один раз. Уберите часть, сохраните, потом добавьте остальные.");
    setSaving(true);
    try {
      const res = await fetch("/api/editor/data", { method: "PUT", headers: { "Content-Type": "application/json" }, body });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || res.statusText);
      setVersion(j.version);
      setSavedJson(JSON.stringify(data));
      setPending((p) => Object.fromEntries(Object.entries(p).map(([n, v]) => [n, { url: v.url }])));
      say("ok", mode === "github" ? "Сохранено на GitHub. Сайт обновится через пару минут." : "Сохранено в файлы проекта.");
    } catch (e) {
      say("err", (e as Error).message);
    } finally {
      setSaving(false);
    }
  };
  const saveRef = useRef(save);
  saveRef.current = save;

  // Ctrl+S — сохранить; уход со страницы с несохранёнными правками — переспросить
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  /* ---------- разделы ---------- */

  const updSection = (id: string, patch: Partial<Section>) => {
    setData((d) => ({
      sections: d.sections.map((s) => (s.id === id ? { ...s, ...patch } : s)),
      entries: patch.id && patch.id !== id ? d.entries.map((e) => (e.section === id ? { ...e, section: patch.id! } : e)) : d.entries,
    }));
    if (patch.id && patch.id !== id) {
      setSecId(patch.id);
      setFresh((f) => {
        const n = new Set(f);
        if (n.delete("s:" + id)) n.add("s:" + patch.id);
        return n;
      });
    }
  };

  const renameSection = (s: Section, name: string) => {
    const patch: Partial<Section> = { name };
    if (fresh.has("s:" + s.id)) {
      const taken = new Set(data.sections.filter((x) => x.id !== s.id).map((x) => x.id));
      patch.id = uniqueId(name, taken, "razdel");
    }
    updSection(s.id, patch);
  };

  const setSectionId = (s: Section, raw: string) => {
    setFresh((f) => {
      const n = new Set(f);
      n.delete("s:" + s.id);
      return n;
    });
    updSection(s.id, { id: raw.toLowerCase().replace(/[^a-z0-9-]/g, "") });
  };

  const addSection = () => {
    const taken = new Set(data.sections.map((s) => s.id));
    const id = uniqueId("novyy-razdel", taken, "razdel");
    const usedColors = new Set(data.sections.map((s) => s.color));
    const color = ((Object.keys(PALETTE) as ColorKey[]).find((c) => !usedColors.has(c)) || "gray") as ColorKey;
    const s: Section = { id, name: "", lead: "", forms: ["карточка", "карточки", "карточек"], icon: "book", color };
    setData((d) => ({ ...d, sections: [...d.sections, s] }));
    setFresh((f) => new Set(f).add("s:" + id));
    setSecId(id);
  };

  const deleteSection = (s: Section) => {
    const n = data.entries.filter((e) => e.section === s.id).length;
    const q = n ? `Удалить раздел «${s.name || "без названия"}» и ${n} ${plural(n, ["карточку", "карточки", "карточек"])} в нём?` : `Удалить раздел «${s.name || "без названия"}»?`;
    if (!confirm(q)) return;
    setData((d) => ({ sections: d.sections.filter((x) => x.id !== s.id), entries: d.entries.filter((e) => e.section !== s.id) }));
    const rest = data.sections.filter((x) => x.id !== s.id);
    setSecId(rest[0]?.id || "");
  };

  const moveSection = (i: number, dir: number) => setData((d) => ({ ...d, sections: swap(d.sections, i, i + dir) }));

  /* ---------- карточки ---------- */

  const updEntry = (id: string, patch: Partial<Entry>) => {
    setData((d) => ({ ...d, entries: d.entries.map((e) => (e.id === id ? { ...e, ...patch } : e)) }));
    if (patch.id && patch.id !== id) {
      if (editId === id) setEditId(patch.id);
      setFresh((f) => {
        const n = new Set(f);
        if (n.delete("e:" + id)) n.add("e:" + patch.id);
        return n;
      });
    }
  };
  /** Пустое поле — убрать его из карточки совсем */
  const setField = (e: Entry, key: "kind" | "fact" | "map", value: string) => {
    const next: Entry = { ...e, [key]: value };
    if (!value) delete next[key];
    setData((d) => ({ ...d, entries: d.entries.map((x) => (x.id === e.id ? next : x)) }));
  };

  const renameEntry = (e: Entry, name: string) => {
    const patch: Partial<Entry> = { name };
    if (fresh.has("e:" + e.id)) {
      const taken = new Set(data.entries.filter((x) => x.id !== e.id).map((x) => x.id));
      patch.id = uniqueId(name, taken, "kartochka");
    }
    updEntry(e.id, patch);
  };

  const setEntryId = (e: Entry, raw: string) => {
    setFresh((f) => {
      const n = new Set(f);
      n.delete("e:" + e.id);
      return n;
    });
    updEntry(e.id, { id: raw.toLowerCase().replace(/[^a-z0-9-]/g, "") });
  };

  const addEntry = () => {
    if (!sec) return;
    const id = uniqueId("novaya-kartochka", new Set(data.entries.map((e) => e.id)), "kartochka");
    setData((d) => ({ ...d, entries: [...d.entries, { id, section: sec.id, name: "", text: "" }] }));
    setFresh((f) => new Set(f).add("e:" + id));
    setEditId(id);
  };

  const deleteEntry = (e: Entry) => {
    if (!confirm(`Удалить карточку «${e.name || "без названия"}»?`)) return;
    setEditId(null);
    setData((d) => ({ ...d, entries: d.entries.filter((x) => x.id !== e.id) }));
  };

  /** Перенести карточку в другой раздел — она встаёт последней */
  const moveToSection = (e: Entry, target: string) => {
    if (e.section === target) return;
    setData((d) => ({ ...d, entries: [...d.entries.filter((x) => x.id !== e.id), { ...e, section: target }] }));
    const t = data.sections.find((s) => s.id === target);
    say("ok", `Карточка «${e.name || "без названия"}» перенесена в раздел «${t?.name || target}». Не забудьте сохранить.`);
  };

  /** Сдвинуть карточку внутри её раздела */
  const moveEntry = (e: Entry, dir: number) =>
    setData((d) => {
      const same = d.entries.map((x, i) => (x.section === e.section ? i : -1)).filter((i) => i >= 0);
      const k = same.indexOf(d.entries.indexOf(e));
      const j = same[k + dir];
      return j === undefined ? d : { ...d, entries: swap(d.entries, same[k], j) };
    });

  const setImage = async (e: Entry, file: File) => {
    if (!file.type.startsWith("image/")) return say("err", "Это не картинка.");
    try {
      const { blob, ext } = await shrinkImage(file);
      const name = `${slugify(e.id) || "kartinka"}-${rand()}.${ext}`;
      const base64 = await toBase64(blob);
      setPending((p) => ({ ...p, [name]: { base64, url: URL.createObjectURL(blob) } }));
      updEntry(e.id, { image: `/encyclopedia/${name}` });
    } catch (err) {
      say("err", "Не получилось загрузить картинку: " + (err as Error).message);
    }
  };
  const removeImage = (e: Entry) => {
    const next = { ...e };
    delete next.image;
    setData((d) => ({ ...d, entries: d.entries.map((x) => (x.id === e.id ? next : x)) }));
  };

  const imgSrc = (image?: string) => {
    if (!image) return undefined;
    return pending[fileOf(image)]?.url || imageBase + image;
  };

  /* ---------- экраны ---------- */

  if (status !== "ready") {
    return (
      <div className="ed ed-center">
        <div className="ed-panel">
          <h1>Редактор энциклопедии</h1>
          {status === "loading" && <p>Загружаю…</p>}
          {status === "off" && (
            <>
              <p>На этом сайте редактор выключен.</p>
              <p className="ed-hint">
                Чтобы он заработал на опубликованном сайте, задайте в Vercel переменные EDITOR_PASSWORD, GITHUB_TOKEN и GITHUB_REPO (подробно — в README).
                На своём компьютере редактор работает в режиме <code>npm run dev</code>.
              </p>
            </>
          )}
          {status === "error" && (
            <>
              <p>Не получилось загрузить данные.</p>
              <p className="ed-hint">{loadError}</p>
              <button className="ed-btn" onClick={load}>
                Попробовать ещё раз
              </button>
            </>
          )}
          {status === "login" && <Login onDone={load} />}
          <p className="ed-hint">
            <a href="/encyclopedia">← К энциклопедии</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="ed">
      <header className="ed-head">
        <a className="brand" href="/encyclopedia" title="К энциклопедии">
          <span className="brand-dot" aria-hidden="true" />
          Редактор
        </a>
        <span className={"ed-mode " + mode} title={mode === "github" ? "Сохранение коммитом в репозиторий" : "Сохранение в файлы проекта"}>
          {mode === "github" ? "GitHub" : "на компьютере"}
        </span>
        <span className="ed-spacer" />
        {dirty && <span className="ed-dirty">есть несохранённые правки</span>}
        <button className="ed-btn primary" onClick={save} disabled={!dirty || saving} title="Ctrl+S">
          {saving ? "Сохраняю…" : "Сохранить"}
        </button>
        {needPassword && (
          <button className="ed-btn ghost" onClick={logOut}>
            Выйти
          </button>
        )}
      </header>

      <div className="ed-body">
        {/* ---------- список разделов ---------- */}
        <aside className="ed-side">
          <div className="ed-side-title">Разделы</div>
          <ul>
            {data.sections.map((s, i) => (
              <li
                key={i}
                className={(s.id === secId ? "on" : "") + (dropSec === s.id ? " drop" : "")}
                style={secStyle(s)}
                onDragOver={(ev) => {
                  if (!dragId || s.id === secId) return;
                  ev.preventDefault();
                  ev.dataTransfer.dropEffect = "move";
                  setDropSec(s.id);
                }}
                onDragLeave={() => setDropSec((cur) => (cur === s.id ? null : cur))}
                onDrop={(ev) => {
                  ev.preventDefault();
                  const e = data.entries.find((x) => x.id === dragId);
                  if (e) moveToSection(e, s.id);
                  setDragId(null);
                  setDropSec(null);
                }}
              >
                <button className="ed-sec" onClick={() => setSecId(s.id)}>
                  <SectionIcon icon={s.icon} />
                  <span>{s.name || "Без названия"}</span>
                  <small>{data.entries.filter((e) => e.section === s.id).length}</small>
                </button>
                <span className="ed-arrows">
                  <button aria-label="Выше" disabled={i === 0} onClick={() => moveSection(i, -1)}>
                    ▲
                  </button>
                  <button aria-label="Ниже" disabled={i === data.sections.length - 1} onClick={() => moveSection(i, 1)}>
                    ▼
                  </button>
                </span>
              </li>
            ))}
          </ul>
          <button className="ed-btn add" onClick={addSection}>
            + Новый раздел
          </button>
        </aside>

        <main className="ed-main">
          {problems.length > 0 && (
            <div className="ed-problems">
              <b>Перед сохранением поправьте:</b>
              <ul>
                {problems.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
          )}

          {!sec ? (
            <div className="ed-empty">Разделов пока нет. Создайте первый слева.</div>
          ) : (
            <>
              {/* ---------- настройки раздела ---------- */}
              <section className="ed-card-box" style={secStyle(sec)}>
                <div className="ed-sec-head">
                  <span className="section-ico">
                    <SectionIcon icon={sec.icon} />
                  </span>
                  <div className="ed-grow">
                    <label className="ed-field">
                      <span>Название раздела</span>
                      <input value={sec.name} placeholder="Например, Существа" onChange={(e) => renameSection(sec, e.target.value)} autoFocus={!sec.name} />
                    </label>
                  </div>
                </div>

                <div className="ed-grid2">
                  <label className="ed-field">
                    <span>Строка на плашке раздела</span>
                    <input value={sec.lead} placeholder="Коротко, о чём раздел" onChange={(e) => updSection(sec.id, { lead: e.target.value })} />
                  </label>
                  <label className="ed-field">
                    <span>Адрес раздела</span>
                    <div className="ed-prefix">
                      <i>/encyclopedia/</i>
                      <input value={sec.id} onChange={(e) => setSectionId(sec, e.target.value)} spellCheck={false} />
                    </div>
                  </label>
                </div>

                <div className="ed-field">
                  <span>Как считать карточки</span>
                  <div className="ed-forms">
                    {(["1", "2", "5"] as const).map((n, k) => (
                      <label key={n}>
                        <i>{n}</i>
                        <input
                          value={sec.forms[k]}
                          onChange={(e) => {
                            const forms = [...sec.forms] as Section["forms"];
                            forms[k] = e.target.value;
                            updSection(sec.id, { forms });
                          }}
                        />
                      </label>
                    ))}
                  </div>
                </div>

                <div className="ed-grid2">
                  <div className="ed-field">
                    <span>Значок</span>
                    <div className="ed-icons">
                      {(Object.keys(ICONS) as IconKey[]).map((k) => (
                        <button key={k} title={ICONS[k]} aria-pressed={sec.icon === k} onClick={() => updSection(sec.id, { icon: k })}>
                          <SectionIcon icon={k} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="ed-field">
                    <span>Цвет</span>
                    <div className="ed-colors">
                      {(Object.keys(PALETTE) as ColorKey[]).map((k) => (
                        <button
                          key={k}
                          title={PALETTE[k].name}
                          aria-label={PALETTE[k].name}
                          aria-pressed={sec.color === k}
                          style={{ background: PALETTE[k].main }}
                          onClick={() => updSection(sec.id, { color: k })}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="ed-row">
                  <a className="ed-link" href={`/encyclopedia/${sec.id}`} target="_blank" rel="noreferrer">
                    Открыть раздел на сайте ↗
                  </a>
                  <span className="ed-spacer" />
                  <button className="ed-btn danger" onClick={() => deleteSection(sec)}>
                    Удалить раздел
                  </button>
                </div>
              </section>

              {/* ---------- карточки раздела ---------- */}
              <div className="ed-row ed-entries-head">
                <h2>
                  Карточки <small>{secEntries.length}</small>
                </h2>
                <span className="ed-spacer" />
                <button className="ed-btn primary" onClick={addEntry}>
                  + Новая карточка
                </button>
              </div>

              {secEntries.length > 0 && data.sections.length > 1 && (
                <p className="ed-hint ed-drag-hint">
                  {dragId ? "Отпустите карточку на нужном разделе слева." : "Чтобы перенести карточку в другой раздел, перетащите её на раздел слева или выберите раздел в самой карточке."}
                </p>
              )}
              {secEntries.length === 0 ? (
                <div className="ed-empty">В этом разделе пока нет карточек.</div>
              ) : (
                <ul className="ed-cards" style={secStyle(sec)}>
                  {secEntries.map((e, i) => (
                    <li key={e.id + i}>
                      <button
                        className={"ed-mini" + (dragId === e.id ? " dragging" : "")}
                        onClick={() => setEditId(e.id)}
                        draggable
                        onDragStart={(ev) => {
                          ev.dataTransfer.effectAllowed = "move";
                          ev.dataTransfer.setData("text/plain", e.name || e.id);
                          setDragId(e.id);
                        }}
                        onDragEnd={() => {
                          setDragId(null);
                          setDropSec(null);
                        }}
                      >
                        <Pic src={imgSrc(e.image)} name={e.name} icon={sec.icon} />
                        <span className="ed-mini-body">
                          {e.kind && <span className="kind">{e.kind}</span>}
                          <b>{e.name || "Без названия"}</b>
                          <span className="ed-mini-text">{e.text || "Нет описания"}</span>
                        </span>
                      </button>
                      <span className="ed-arrows row">
                        <button aria-label="Раньше" disabled={i === 0} onClick={() => moveEntry(e, -1)}>
                          ◀
                        </button>
                        <button aria-label="Позже" disabled={i === secEntries.length - 1} onClick={() => moveEntry(e, 1)}>
                          ▶
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </main>
      </div>

      {/* ---------- карточка в редактировании ---------- */}
      {editing && (
        <EntryDialog
          entry={editing}
          sections={data.sections}
          places={places}
          placeTaken={(placeId) => data.entries.find((x) => x.map === placeId && x.id !== editing.id)?.name}
          src={imgSrc(editing.image)}
          onClose={() => setEditId(null)}
          onRename={(name) => renameEntry(editing, name)}
          onId={(id) => setEntryId(editing, id)}
          onPatch={(patch) => updEntry(editing.id, patch)}
          onMove={(target) => moveToSection(editing, target)}
          onField={(key, v) => setField(editing, key, v)}
          onImage={(f) => setImage(editing, f)}
          onRemoveImage={() => removeImage(editing)}
          onDelete={() => deleteEntry(editing)}
        />
      )}

      {toast && (
        <div className={"ed-toast " + toast.kind} role="status">
          {toast.text}
        </div>
      )}
    </div>
  );
}

/* ---------- картинка или заглушка ---------- */
function Pic({ src, name, icon }: { src?: string; name: string; icon: IconKey }) {
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [src]);
  if (src && !broken) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className="pic" src={src} alt="" onError={() => setBroken(true)} />;
  }
  return (
    <span className="pic stub" aria-hidden="true">
      <span className="stub-letter">{name[0] || "?"}</span>
      <span className="stub-ico">
        <SectionIcon icon={icon} />
      </span>
    </span>
  );
}

/* ---------- вход ---------- */
function Login({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/editor/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    setBusy(false);
    if (res.ok) onDone();
    else setError((await res.json().catch(() => ({}))).error || "Не получилось войти");
  };
  return (
    <form className="ed-login" onSubmit={submit}>
      <label className="ed-field">
        <span>Пароль</span>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus autoComplete="current-password" />
      </label>
      {error && <p className="ed-error">{error}</p>}
      <button className="ed-btn primary" disabled={busy || !password}>
        {busy ? "Проверяю…" : "Войти"}
      </button>
    </form>
  );
}

/* ---------- окно карточки ---------- */
function EntryDialog(props: {
  entry: Entry;
  sections: Section[];
  places: Place[];
  placeTaken: (placeId: string) => string | undefined;
  src?: string;
  onClose: () => void;
  onRename: (name: string) => void;
  onId: (id: string) => void;
  onPatch: (patch: Partial<Entry>) => void;
  onMove: (section: string) => void;
  onField: (key: "kind" | "fact" | "map", value: string) => void;
  onImage: (f: File) => void;
  onRemoveImage: () => void;
  onDelete: () => void;
}) {
  const { entry: e, sections, places, src } = props;
  const sec = sections.find((s) => s.id === e.section) || sections[0];
  const [drag, setDrag] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const takenBy = e.map ? props.placeTaken(e.map) : undefined;
  const onClose = props.onClose;

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => ev.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="ed-overlay" onMouseDown={(ev) => ev.target === ev.currentTarget && onClose()}>
      <div className="ed-dialog" role="dialog" aria-label={e.name || "Новая карточка"} style={sec ? secStyle(sec) : undefined}>
        <div
          className={"ed-pic" + (drag ? " drag" : "")}
          onDragOver={(ev) => {
            ev.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(ev) => {
            ev.preventDefault();
            setDrag(false);
            const f = ev.dataTransfer.files[0];
            if (f) props.onImage(f);
          }}
        >
          <Pic src={src} name={e.name} icon={sec?.icon || "book"} />
          <div className="ed-pic-actions">
            <button className="ed-btn" onClick={() => fileRef.current?.click()}>
              {e.image ? "Заменить картинку" : "Загрузить картинку"}
            </button>
            {e.image && (
              <button className="ed-btn ghost" onClick={props.onRemoveImage}>
                Убрать
              </button>
            )}
          </div>
          <p className="ed-hint">Можно перетащить файл сюда. Лучше всего — 4:3, большие картинки уменьшатся сами.</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(ev) => {
              const f = ev.target.files?.[0];
              if (f) props.onImage(f);
              ev.target.value = "";
            }}
          />
        </div>

        <div className="ed-form">
          <button className="x" aria-label="Закрыть" onClick={onClose}>
            ×
          </button>
          <label className="ed-field">
            <span>Название</span>
            <input className="big" value={e.name} placeholder="Например, Вкусника" onChange={(ev) => props.onRename(ev.target.value)} autoFocus={!e.name} />
          </label>
          <label className="ed-field">
            <span>Подпись над названием</span>
            <input value={e.kind || ""} placeholder="ягода, зелье, лес… можно оставить пустым" onChange={(ev) => props.onField("kind", ev.target.value)} />
          </label>
          <label className="ed-field">
            <span>Описание</span>
            <textarea rows={9} value={e.text} onChange={(ev) => props.onPatch({ text: ev.target.value })} />
            <small>Пустая строка — новый абзац. На карточке видно начало первого абзаца, целиком текст — при открытии.</small>
          </label>
          <label className="ed-field">
            <span>Интересный факт</span>
            <textarea rows={3} value={e.fact || ""} placeholder="Можно оставить пустым" onChange={(ev) => props.onField("fact", ev.target.value)} />
          </label>
          <div className="ed-grid2">
            <label className="ed-field">
              <span>Раздел</span>
              <select value={e.section} onChange={(ev) => props.onMove(ev.target.value)}>
                {sections.map((s, i) => (
                  <option key={i} value={s.id}>
                    {s.name || "Без названия"}
                  </option>
                ))}
              </select>
            </label>
            <label className="ed-field">
              <span>Место на карте</span>
              <select value={e.map || ""} onChange={(ev) => props.onField("map", ev.target.value)}>
                <option value="">— не привязана —</option>
                {places.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              {takenBy && <small className="ed-warn">К этому месту уже привязана карточка «{takenBy}» — на карте покажется только одна.</small>}
            </label>
          </div>
          <label className="ed-field">
            <span>Адрес карточки</span>
            <div className="ed-prefix">
              <i>/encyclopedia/{e.section}#</i>
              <input value={e.id} onChange={(ev) => props.onId(ev.target.value)} spellCheck={false} />
            </div>
          </label>
          <div className="ed-row">
            <button className="ed-btn danger" onClick={props.onDelete}>
              Удалить карточку
            </button>
            <span className="ed-spacer" />
            <button className="ed-btn primary" onClick={onClose}>
              Готово
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
