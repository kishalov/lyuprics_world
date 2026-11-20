import type { Metadata } from "next";
import Editor from "@/components/editor/Editor";
import { mapPlaces } from "@/lib/world";
import { pageMeta } from "@/lib/meta";
import "./editor.css";

export const metadata: Metadata = {
  ...pageMeta({ title: "Редактор", path: "/editor" }),
  robots: { index: false, follow: false },
};

/** Редактор энциклопедии. Доступ проверяет сервер (src/lib/editor/auth.ts) */
export default function EditorPage() {
  return <Editor places={mapPlaces()} />;
}
