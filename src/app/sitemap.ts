import type { MetadataRoute } from "next";
import { getContent } from "@/lib/data/repository";
import { publicEnv } from "@/lib/env";

/** Only pages with real content are listed. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const c = await getContent();
  const url = (path: string) => `${publicEnv.siteUrl}${path}`;
  const staticPaths = ["/", "/diagnose", "/printers", "/guides", "/filament", "/maintenance", "/parts", "/error-codes", "/about", "/safety", "/contact", "/privacy", "/terms"];
  return [
    ...staticPaths.map((p) => ({ url: url(p) })),
    ...c.flows.map((f) => ({ url: url(`/diagnose/${f.id}`) })),
    ...c.categories.map((x) => ({ url: url(`/problems/${x.slug}`) })),
    ...c.printers.map((p) => ({ url: url(`/printers/${p.slug}`), lastModified: p.lastVerified ?? undefined })),
    ...c.guides.map((g) => ({ url: url(`/guides/${g.slug}`), lastModified: g.verification.lastReviewed ?? undefined })),
    ...c.filaments.map((f) => ({ url: url(`/filament/${f.slug}`) })),
    ...c.errorCodes.map((e) => ({ url: url(`/error-codes/${e.slug}`) })),
  ];
}
