import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { feedbackSchema, type FeedbackResponse } from "@/lib/feedback";
import { canStoreFeedback } from "@/lib/server/env";
import { serviceClient } from "@/lib/server/supabase";

// Simple per-instance rate limit. In a multi-instance deployment, put a shared
// limiter (for example at the edge) in front of this route as well.
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > MAX_PER_WINDOW;
}

const json = (body: FeedbackResponse, status = 200) => NextResponse.json(body, { status });

export async function POST(request: NextRequest) {
  // Only accept submissions from this site's own pages.
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return json({ ok: false, error: "Cross-origin requests are not accepted." }, 403);

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) return json({ ok: false, error: "Too many reports in a short time. Please wait a minute and try again." }, 429);

  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > 16_000) return json({ ok: false, error: "The report is too large." }, 413);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "The report could not be read." }, 400);
  }

  const parsed = feedbackSchema.safeParse(body);
  if (!parsed.success) {
    const first = z.flattenError(parsed.error);
    const message = Object.values(first.fieldErrors).flat()[0] ?? first.formErrors[0] ?? "The report is not valid.";
    return json({ ok: false, error: message }, 400);
  }
  const f = parsed.data;
  // Bots fill the honeypot. Pretend success without storing anything.
  if (f.website) return json({ ok: true, stored: false, reason: "not-configured" });

  if (!canStoreFeedback()) {
    if (process.env.NODE_ENV !== "production") console.info("[feedback] Not stored (Supabase not configured):", f.kind, f.message.slice(0, 200));
    return json({ ok: true, stored: false, reason: "not-configured" });
  }

  const { error } = await serviceClient()
    .from("feedback")
    .insert({ kind: f.kind, message: f.message || null, page: f.page ?? null, contact_email: f.contactEmail || null, context: f.context });
  if (error) {
    console.error("[feedback] Insert failed:", error.message);
    return json({ ok: false, error: "Your report could not be saved. Please try again later." }, 500);
  }
  return json({ ok: true, stored: true });
}
