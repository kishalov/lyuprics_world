import type { NextConfig } from "next";
import { WORLD } from "./src/data/world";

// Раньше карта жила в корне сайта (/kruzhye/...). Теперь она в /map —
// старые ссылки перенаправляем, чтобы они не сломались.
const oldMapRoots = (WORLD.children || []).map((n) => n.id).join("|");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [{ source: `/:place(${oldMapRoots})/:rest*`, destination: "/map/:place/:rest*", permanent: false }];
  },
};

export default nextConfig;
