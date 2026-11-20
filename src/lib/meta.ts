/* =====================================================================
   МЕТАДАННЫЕ: заголовки, описания и превью ссылок (Open Graph, Twitter).
   Картинка превью — public/og.jpg (делается из art-src/og.png: npm run og).
   ===================================================================== */

import type { Metadata } from "next";

export const SITE_NAME = "Люприки";
export const SITE_TITLE = "Люприки — карта и энциклопедия вселенной люприков";
export const SITE_DESCRIPTION =
  "Сайт, посвящённый вселенной люприков: интерактивная карта мира и энциклопедия — персонажи, локации, флора, фауна и вещички.";
export const SITE_KEYWORDS = [
  "люприки",
  "вселенная люприков",
  "мир люприков",
  "карта мира",
  "интерактивная карта",
  "энциклопедия",
  "персонажи",
  "земли Ыш",
  "Питучий лес",
];

export const OG_IMAGE = { url: "/og.jpg", width: 1200, height: 630, alt: "Люприки — обложка вселенной" };

export const siteUrl = () =>
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

/**
 * Метаданные страницы: заголовок (целиком, без шаблонов), описание,
 * канонический адрес и превью для соцсетей с общей картинкой.
 */
export function pageMeta({ title, description, path }: { title?: string; description?: string; path: string }): Metadata {
  const full = title ? `${title} — ${SITE_NAME}` : SITE_TITLE;
  const desc = description || SITE_DESCRIPTION;
  return {
    title: { absolute: full },
    description: desc,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "ru_RU",
      url: path,
      title: full,
      description: desc,
      images: [OG_IMAGE],
    },
    twitter: { card: "summary_large_image", title: full, description: desc, images: [OG_IMAGE.url] },
  };
}

/** Первое предложение текста — для описаний */
export const firstSentence = (text: string) => text.split(/(?<=[.!?])\s/)[0];
