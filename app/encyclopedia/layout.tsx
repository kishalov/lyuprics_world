import { SiteHeader } from "@/components/site/SiteNav";

export default function EncyclopediaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="site">
      <SiteHeader active="encyclopedia" />
      <main className="site-main">{children}</main>
    </div>
  );
}
