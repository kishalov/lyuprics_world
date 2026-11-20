import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Explorer from "@/components/Explorer";
import { allOpenableIds, getNode, idFromSlug, slugFor } from "@/lib/world";

type Props = { params: Promise<{ slug?: string[] }> };

// Все адреса карты собираются заранее: /map, /map/pitychiy-les, /map/kruzhye/dom-kartografa, …
export function generateStaticParams() {
  return allOpenableIds().map((id) => ({ slug: slugFor(id) }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const id = idFromSlug(slug);
  const node = id ? getNode(id) : undefined;
  if (!node || node.id === "world") return { title: "Карта мира" };
  return { title: node.name, description: node.desc };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const id = idFromSlug(slug);
  if (!id) notFound();
  return <Explorer initialId={id} />;
}
