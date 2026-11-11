import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Карта земель Ыш", template: "%s — Земли Ыш" },
  description: "Интерактивная карта земель Ыш: приближайтесь к местам, заходите в дома и говорите с жителями.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#f2e4d4",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Neucha&family=Lora:ital,wght@0,400;0,600;1,400&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
