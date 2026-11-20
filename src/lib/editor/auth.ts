/* =====================================================================
   РЕДАКТОР: режим работы и вход.

   Режимы:
     local  — `npm run dev` на своём компьютере: правки пишутся прямо в файлы проекта.
     github — опубликованный сайт: правки уходят коммитом в репозиторий на GitHub,
              Vercel видит коммит и пересобирает сайт. Нужны переменные окружения
              EDITOR_PASSWORD, GITHUB_TOKEN и GITHUB_REPO (см. .env.example).
     off    — всё остальное: редактор выключен.

   Пароль (EDITOR_PASSWORD) обязателен в режиме github. В local он нужен,
   только если задан — иначе редактор открыт без входа.
   ===================================================================== */

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export type EditorMode = "local" | "github" | "off";

const COOKIE = "lyupriki-editor";
const MONTH = 60 * 60 * 24 * 30;

export function editorMode(): EditorMode {
  if (process.env.NODE_ENV === "development") return "local";
  const env = process.env;
  if (env.EDITOR_PASSWORD && env.GITHUB_TOKEN && env.GITHUB_REPO) return "github";
  return "off";
}

const password = () => process.env.EDITOR_PASSWORD || "";
export const passwordRequired = () => editorMode() === "github" || password() !== "";

/** Метка входа: зависит от пароля, поэтому смена пароля выкидывает всех */
const token = () => createHmac("sha256", password()).update("lyupriki-editor-v1").digest("hex");

function same(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export async function isAuthorized(): Promise<boolean> {
  if (editorMode() === "off") return false;
  if (!passwordRequired()) return true;
  const c = (await cookies()).get(COOKIE)?.value;
  return !!c && same(c, token());
}

/** Проверяет пароль и ставит метку входа. Неверный пароль — с задержкой, чтобы не подбирали */
export async function logIn(attempt: string): Promise<boolean> {
  if (editorMode() === "off") return false;
  if (!same(attempt, password())) {
    await new Promise((r) => setTimeout(r, 1200));
    return false;
  }
  (await cookies()).set(COOKIE, token(), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MONTH,
  });
  return true;
}

export async function logOut() {
  (await cookies()).delete(COOKIE);
}

/** Запросы на изменение принимаем только с этого же сайта и только JSON */
export function sameOriginJson(req: Request): boolean {
  if (!(req.headers.get("content-type") || "").includes("application/json")) return false;
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(req.url).host || new URL(origin).host === req.headers.get("host");
  } catch {
    return false;
  }
}
