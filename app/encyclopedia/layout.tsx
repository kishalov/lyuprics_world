import type { Metadata } from "next";
import { SiteHeader } from "@/components/site/SiteNav";

export const metadata: Metadata = {
  title: { default: "Энциклопедия", template: "%s — Энциклопедия люприков" },
  description: "Энциклопедия мира люприков: персонажи, локации, флора, фауна и вещички.",
};

export default function EncyclopediaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="site">
      <SiteHeader active="encyclopedia" />
      <main className="site-main">{children}</main>
    </div>
  );
}
