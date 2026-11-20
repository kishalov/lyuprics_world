import { normalizeData, validateData } from "@/data/encyclopedia-schema";
import { editorMode, isAuthorized, sameOriginJson } from "@/lib/editor/auth";
import { Conflict, loadData, saveData, type NewImage } from "@/lib/editor/storage";

export const dynamic = "force-dynamic";

const MAX_IMAGE = 3 * 1024 * 1024;
const NAME_RE = /^[a-z0-9][a-z0-9-]*\.(webp|jpg|jpeg|png)$/;

/** Это действительно картинка? Проверяем первые байты файла */
function isImage(b: Buffer): boolean {
  const webp = b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP";
  const png = b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const jpg = b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  return webp || png || jpg;
}

const fail = (error: string, status = 400) => Response.json({ error }, { status });

/** Текущие данные энциклопедии */
export async function GET() {
  if (!(await isAuthorized())) return fail("Нужно войти", 401);
  try {
    // в режиме github новые картинки появятся на сайте только после пересборки — показываем их прямо из репозитория
    const imageBase =
      editorMode() === "github" ? `https://raw.githubusercontent.com/${process.env.GITHUB_REPO}/${process.env.GITHUB_BRANCH || "main"}/public` : "";
    return Response.json({ ...(await loadData()), imageBase });
  } catch (e) {
    console.error(e);
    return fail("Не удалось прочитать данные: " + (e as Error).message, 500);
  }
}

/** Сохранить: { data, version, images: [{ name, base64 }] } */
export async function PUT(req: Request) {
  if (!sameOriginJson(req)) return fail("Неверный запрос");
  if (!(await isAuthorized())) return fail("Нужно войти", 401);

  const body = (await req.json().catch(() => null)) as { data?: unknown; version?: unknown; images?: unknown } | null;
  if (!body || typeof body.version !== "string") return fail("Неверный запрос");

  let data;
  try {
    data = normalizeData(body.data);
  } catch (e) {
    return fail((e as Error).message);
  }
  const errors = validateData(data);
  if (errors.length) return fail(errors.join("\n"));

  // новые картинки: только те, на которые ссылаются карточки
  const used = new Set(data.entries.map((e) => e.image).filter(Boolean));
  const images: NewImage[] = [];
  for (const raw of Array.isArray(body.images) ? body.images : []) {
    const { name, base64 } = (raw || {}) as { name?: unknown; base64?: unknown };
    if (typeof name !== "string" || typeof base64 !== "string" || !NAME_RE.test(name)) return fail("Неверное имя картинки");
    if (!used.has(`/encyclopedia/${name}`)) continue;
    const bytes = Buffer.from(base64, "base64");
    if (bytes.length > MAX_IMAGE) return fail(`Картинка ${name} больше 3 МБ`);
    if (!isImage(bytes)) return fail(`Файл ${name} — не картинка`);
    images.push({ name, bytes });
  }

  try {
    const before = (await loadData()).data;
    const version = await saveData(data, images, body.version, before);
    return Response.json({ version });
  } catch (e) {
    if (e instanceof Conflict) return fail("Данные успели измениться в другом месте. Обновите страницу редактора — несохранённые правки придётся повторить.", 409);
    console.error(e);
    return fail("Не удалось сохранить: " + (e as Error).message, 500);
  }
}
