import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/meta";

/** Как сайт выглядит, если добавить его на главный экран телефона */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Люприки — вселенная люприков",
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    lang: "ru",
    start_url: "/",
    display: "standalone",
    background_color: "#fbf8f1",
    theme_color: "#fbf8f1",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
