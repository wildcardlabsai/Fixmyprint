import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { search } from "@/lib/search/search";
import { getSearchIndex } from "@/lib/search/server";

const querySchema = z.object({
  q: z.string().trim().min(1).max(120),
  limit: z.coerce.number().int().min(1).max(30).default(10),
});

export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse({
    q: request.nextUrl.searchParams.get("q") ?? "",
    limit: request.nextUrl.searchParams.get("limit") ?? undefined,
  });
  if (!parsed.success) return NextResponse.json({ results: [] });

  const index = await getSearchIndex();
  const results = search(index, parsed.data.q, parsed.data.limit).map(({ doc }) => ({
    type: doc.type,
    id: doc.id,
    title: doc.title,
    subtitle: doc.subtitle,
    href: doc.href,
  }));
  return NextResponse.json({ results }, { headers: { "Cache-Control": "public, max-age=60, s-maxage=300" } });
}
