import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Explorer from "@/components/Explorer";
import { allOpenableIds, getNode, idFromSlug, urlFor } from "@/lib/world";

type Props = { params: Promise<{ slug?: string[] }> };

// Все адреса мира собираются заранее: /, /pitychiy-les, /pitychiy-les/kruzhye, …
export function generateStaticParams() {
  return allOpenableIds().map((id) => ({ slug: id === "world" ? [] : urlFor(id).slice(1).split("/") }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const id = idFromSlug(slug);
  const node = id ? getNode(id) : undefined;
  if (!node || node.id === "world") return {};
  return { title: node.name, description: node.desc };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const id = idFromSlug(slug);
  if (!id) notFound();
  return <Explorer initialId={id} />;
}
