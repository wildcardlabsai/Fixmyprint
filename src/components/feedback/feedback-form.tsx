"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { sendFeedback } from "@/lib/client/send-feedback";
import type { FeedbackInput, FeedbackResponse } from "@/lib/feedback";

interface Props {
  kind: FeedbackInput["kind"];
  context?: Record<string, unknown>;
  label: string;
  hint?: string;
  askEmail?: boolean;
  submitLabel?: string;
  onDone?: () => void;
}

export function FeedbackForm({ kind, context = {}, label, hint, askEmail, submitLabel = "Send report", onDone }: Props) {
  const id = useId();
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<FeedbackResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (result?.ok) {
    return result.stored ? (
      <Notice tone="success" title="Thank you. Your report has been saved.">
        It will be reviewed before any content is changed.
      </Notice>
    ) : (
      <Notice tone="info" title="Your report was not saved.">
        This copy of FixMyPrint is not set up to store feedback, so nothing was recorded.
      </Notice>
    );
  }

  return (
    <form
      noValidate
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        if (message.trim().length < 3) {
          setError("Please add a few words describing the problem.");
          return;
        }
        setError(null);
        setPending(true);
        const r = await sendFeedback({ kind, message, contactEmail: email, context, website });
        setPending(false);
        if (r.ok) {
          setResult(r);
          onDone?.();
        } else setError(r.error);
      }}
    >
      <div>
        <label htmlFor={`${id}-msg`} className="block text-sm font-medium">
          {label}
        </label>
        {hint && (
          <p id={`${id}-hint`} className="mt-0.5 text-sm text-muted">
            {hint}
          </p>
        )}
        <textarea
          id={`${id}-msg`}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          maxLength={4000}
          required
          aria-invalid={error ? true : undefined}
          aria-describedby={[hint ? `${id}-hint` : "", error ? `${id}-err` : ""].filter(Boolean).join(" ") || undefined}
          className="mt-1.5 w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-[15px] focus:border-primary focus:outline-none"
        />
      </div>
      {askEmail && (
        <div>
          <label htmlFor={`${id}-email`} className="block text-sm font-medium">
            Email address <span className="font-normal text-muted">(optional, only if you would like a reply)</span>
          </label>
          <input
            id={`${id}-email`}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 h-11 w-full rounded-md border border-line-strong bg-surface px-3 text-[15px] focus:border-primary focus:outline-none"
          />
        </div>
      )}
      <div className="hidden" aria-hidden>
        <label>
          Leave this empty
          <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </label>
      </div>
      {error && (
        <p id={`${id}-err`} role="alert" className="text-sm font-medium text-error">
          {error}
        </p>
      )}
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Sending…" : submitLabel}
      </Button>
    </form>
  );
}
