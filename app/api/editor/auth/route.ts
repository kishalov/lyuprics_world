import { editorMode, isAuthorized, logIn, logOut, passwordRequired, sameOriginJson } from "@/lib/editor/auth";

export const dynamic = "force-dynamic";

/** Состояние редактора: включён ли, нужен ли пароль, вошли ли уже */
export async function GET() {
  const mode = editorMode();
  return Response.json({ mode, needPassword: mode !== "off" && passwordRequired(), authorized: await isAuthorized() });
}

/** Вход по паролю */
export async function POST(req: Request) {
  if (!sameOriginJson(req)) return Response.json({ error: "Неверный запрос" }, { status: 400 });
  if (editorMode() === "off") return Response.json({ error: "Редактор выключен" }, { status: 403 });
  const { password } = (await req.json().catch(() => ({}))) as { password?: unknown };
  const ok = typeof password === "string" && (await logIn(password));
  return ok ? Response.json({ ok: true }) : Response.json({ error: "Неверный пароль" }, { status: 401 });
}

/** Выход */
export async function DELETE() {
  await logOut();
  return Response.json({ ok: true });
}
