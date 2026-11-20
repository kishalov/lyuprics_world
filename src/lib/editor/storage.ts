/* =====================================================================
   РЕДАКТОР: где лежат данные энциклопедии и как их сохранить.
     local  — файлы проекта: src/data/encyclopedia.json и public/encyclopedia/
     github — те же файлы в репозитории; одно сохранение = один коммит
   version — отпечаток файла с данными. Сохранение проходит, только если с момента
   загрузки файл никто не менял (иначе можно затереть чужие правки).
   ===================================================================== */

import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { normalizeData, serializeData, type EncyclopediaData } from "@/data/encyclopedia-schema";
import { editorMode } from "./auth";

const JSON_PATH = "src/data/encyclopedia.json";
const IMG_DIR = "public/encyclopedia";

export interface Snapshot {
  data: EncyclopediaData;
  version: string;
}
/** Новая картинка: имя файла в public/encyclopedia/ и содержимое */
export interface NewImage {
  name: string;
  bytes: Buffer;
}
export class Conflict extends Error {}

const imageFile = (src: string) => src.replace(/^\/encyclopedia\//, "");

/** Картинки, которые были в старых данных и пропали из новых — их файлы удаляем */
const unusedImages = (before: EncyclopediaData, after: EncyclopediaData) => {
  const keep = new Set(after.entries.map((e) => e.image).filter(Boolean));
  return [...new Set(before.entries.map((e) => e.image).filter((s): s is string => !!s && !keep.has(s)))].map(imageFile);
};

/* ---------- local ---------- */

const root = () => process.cwd();
const sha1 = (s: string) => createHash("sha1").update(s).digest("hex");

async function loadLocal(): Promise<Snapshot> {
  const text = await fs.readFile(path.join(root(), JSON_PATH), "utf8");
  return { data: normalizeData(JSON.parse(text)), version: sha1(text) };
}

async function saveLocal(data: EncyclopediaData, images: NewImage[], base: string): Promise<string> {
  const current = await loadLocal();
  if (current.version !== base) throw new Conflict();
  const dir = path.join(root(), IMG_DIR);
  await fs.mkdir(dir, { recursive: true });
  for (const img of images) await fs.writeFile(path.join(dir, img.name), img.bytes);
  for (const name of unusedImages(current.data, data)) await fs.rm(path.join(dir, name), { force: true });
  const text = serializeData(data);
  await fs.writeFile(path.join(root(), JSON_PATH), text, "utf8");
  return sha1(text);
}

/* ---------- github ---------- */

function gh() {
  const repo = process.env.GITHUB_REPO!; // "владелец/репозиторий"
  const branch = process.env.GITHUB_BRANCH || "main";
  const call = async <T>(method: string, url: string, body?: unknown): Promise<T> => {
    const res = await fetch(`https://api.github.com/repos/${repo}${url}`, {
      method,
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "lyupriki-editor",
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`GitHub ${method} ${url}: ${res.status} ${(await res.text()).slice(0, 300)}`);
    return (await res.json()) as T;
  };
  return { branch, call };
}

async function loadGithub(): Promise<Snapshot> {
  const { branch, call } = gh();
  const file = await call<{ content: string; sha: string }>("GET", `/contents/${JSON_PATH}?ref=${encodeURIComponent(branch)}`);
  const text = Buffer.from(file.content, "base64").toString("utf8");
  return { data: normalizeData(JSON.parse(text)), version: file.sha };
}

async function saveGithub(data: EncyclopediaData, images: NewImage[], base: string, message: string): Promise<string> {
  const { branch, call } = gh();
  const current = await loadGithub();
  if (current.version !== base) throw new Conflict();

  const ref = await call<{ object: { sha: string } }>("GET", `/git/ref/heads/${encodeURIComponent(branch)}`);
  const head = await call<{ tree: { sha: string } }>("GET", `/git/commits/${ref.object.sha}`);

  type TreeItem = { path: string; mode: "100644"; type: "blob"; sha: string | null };
  const tree: TreeItem[] = [];
  for (const img of images) {
    const blob = await call<{ sha: string }>("POST", "/git/blobs", { content: img.bytes.toString("base64"), encoding: "base64" });
    tree.push({ path: `${IMG_DIR}/${img.name}`, mode: "100644", type: "blob", sha: blob.sha });
  }
  const unused = unusedImages(current.data, data);
  if (unused.length) {
    // удалять можно только то, что действительно лежит в репозитории
    const existing = new Set(
      await call<{ name: string }[]>("GET", `/contents/${IMG_DIR}?ref=${encodeURIComponent(branch)}`)
        .then((list) => list.map((f) => f.name))
        .catch(() => [] as string[]),
    );
    for (const name of unused) if (existing.has(name)) tree.push({ path: `${IMG_DIR}/${name}`, mode: "100644", type: "blob", sha: null });
  }
  const json = await call<{ sha: string }>("POST", "/git/blobs", { content: serializeData(data), encoding: "utf-8" });
  tree.push({ path: JSON_PATH, mode: "100644", type: "blob", sha: json.sha });

  const newTree = await call<{ sha: string }>("POST", "/git/trees", { base_tree: head.tree.sha, tree });
  const commit = await call<{ sha: string }>("POST", "/git/commits", { message, tree: newTree.sha, parents: [ref.object.sha] });
  // force: false — если ветка успела уйти вперёд, GitHub откажет, и ничего не потеряется
  await call("PATCH", `/git/refs/heads/${encodeURIComponent(branch)}`, { sha: commit.sha, force: false });
  return json.sha;
}

/* ---------- общее ---------- */

export function loadData(): Promise<Snapshot> {
  return editorMode() === "github" ? loadGithub() : loadLocal();
}

/** Короткое описание правок для коммита: «+ Вкусника, ✎ Росинки, − Термосок» */
export function describeChanges(before: EncyclopediaData, after: EncyclopediaData): string {
  const old = new Map(before.entries.map((e) => [e.id, JSON.stringify(e)]));
  const now = new Set(after.entries.map((e) => e.id));
  const parts: string[] = [];
  for (const e of after.entries) {
    if (!old.has(e.id)) parts.push(`+ ${e.name}`);
    else if (old.get(e.id) !== JSON.stringify(e)) parts.push(`✎ ${e.name}`);
  }
  for (const e of before.entries) if (!now.has(e.id)) parts.push(`− ${e.name}`);
  if (JSON.stringify(before.sections) !== JSON.stringify(after.sections)) parts.push("разделы");
  const list = parts.slice(0, 8).join(", ") + (parts.length > 8 ? ` и ещё ${parts.length - 8}` : "");
  return `Энциклопедия: ${list || "правки"}`;
}

export async function saveData(data: EncyclopediaData, images: NewImage[], base: string, before: EncyclopediaData): Promise<string> {
  if (editorMode() === "github") return saveGithub(data, images, base, describeChanges(before, data) + "\n\nИз редактора на сайте.");
  return saveLocal(data, images, base);
}
