// @vitest-environment node
import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const post = async (body: unknown, headers: Record<string, string> = {}) => {
  const { POST } = await import("./route");
  const req = new NextRequest("http://localhost:3000/api/feedback", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: { "content-type": "application/json", origin: "http://localhost:3000", "x-forwarded-for": headers.ip ?? "1.1.1.1", ...headers },
  });
  const res = await POST(req);
  return { status: res.status, json: await res.json() };
};

describe("POST /api/feedback", () => {
  it("validates and reports honestly that nothing was stored when Supabase is not configured", async () => {
    const r = await post({ kind: "incorrect-diagnosis", message: "The probe was fine", context: { flowId: "x" } }, { ip: "10.0.0.1" });
    expect(r.status).toBe(200);
    expect(r.json).toEqual({ ok: true, stored: false, reason: "not-configured" });
  });

  it("rejects invalid input with a useful message", async () => {
    const r = await post({ kind: "contact", message: "" }, { ip: "10.0.0.2" });
    expect(r.status).toBe(400);
    expect(r.json.error).toMatch(/few words/i);
    expect((await post({ kind: "spam", message: "hello" }, { ip: "10.0.0.2" })).status).toBe(400);
    expect((await post("not json", { ip: "10.0.0.2" })).status).toBe(400);
  });

  it("rejects cross-origin submissions", async () => {
    const r = await post({ kind: "contact", message: "hello there" }, { origin: "https://evil.example", ip: "10.0.0.3" });
    expect(r.status).toBe(403);
  });

  it("rate limits repeated submissions", async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 7; i++) statuses.push((await post({ kind: "contact", message: "hello there" }, { ip: "10.0.0.4" })).status);
    expect(statuses).toContain(429);
  });
});
