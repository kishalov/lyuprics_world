import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Explorer from "@/components/Explorer";
import { allOpenableIds, getNode, idFromSlug, slugFor, urlFor } from "@/lib/world";
import { entryForPlace, entryLead } from "@/data/encyclopedia";
import { firstSentence, pageMeta } from "@/lib/meta";

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
  if (!node) return {};
  if (node.id === "world")
    return pageMeta({
      title: "Карта мира",
      description: "Интерактивная карта мира люприков: приближайте места, заглядывайте в дома и говорите с жителями.",
      path: urlFor("world"),
    });
  const entry = entryForPlace(node.id);
  const about = node.desc || (entry ? firstSentence(entryLead(entry)) : "");
  return pageMeta({
    title: node.name,
    description: `${node.name} на карте мира люприков.${about ? " " + about : ""}`,
    path: urlFor(node.id),
  });
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const id = idFromSlug(slug);
  if (!id) notFound();
  return <Explorer initialId={id} />;
}
