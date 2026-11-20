import type { Metadata, Viewport } from "next";
import { OG_IMAGE, SITE_DESCRIPTION, SITE_KEYWORDS, SITE_NAME, SITE_TITLE, pageMeta, siteUrl } from "@/lib/meta";
import "./globals.css";
import "./site.css";

/* Общие метаданные сайта. У страниц свои заголовки и описания — через pageMeta (src/lib/meta.ts) */
export const metadata: Metadata = {
  ...pageMeta({ path: "/" }),
  metadataBase: new URL(siteUrl()),
  title: { default: SITE_TITLE, template: `%s — ${SITE_NAME}` },
  applicationName: SITE_NAME,
  keywords: SITE_KEYWORDS,
  category: "entertainment",
  robots: { index: true, follow: true },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#fbf8f1",
};

/** Описание сайта для поисковиков (schema.org) */
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  alternateName: "Вселенная люприков",
  url: siteUrl(),
  description: SITE_DESCRIPTION,
  inLanguage: "ru",
  image: new URL(OG_IMAGE.url, siteUrl()).toString(),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Neucha&family=Nunito:wght@400;600;700&display=swap"
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
