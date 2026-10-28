"use client";

import type { FeedbackInput, FeedbackResponse } from "@/lib/feedback";

export async function sendFeedback(input: FeedbackInput): Promise<FeedbackResponse> {
  try {
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...input, page: input.page ?? window.location.pathname }),
    });
    const data = (await res.json()) as FeedbackResponse;
    return data;
  } catch {
    return { ok: false, error: "Could not reach the server. Check your connection and try again." };
  }
}
