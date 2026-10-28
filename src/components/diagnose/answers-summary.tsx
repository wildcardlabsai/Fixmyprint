"use client";

import { Pencil } from "lucide-react";
import type { PathStep } from "@/lib/engine/engine";

export function AnswersSummary({ steps, onChange, editing }: { steps: PathStep[]; onChange: (questionId: string) => void; editing: string | null }) {
  if (steps.length === 0) return <p className="text-sm text-muted">Your answers will appear here.</p>;
  return (
    <ol className="space-y-3">
      {steps.map((s, i) => (
        <li key={s.question.id} className="text-sm">
          <p className="text-muted">
            <span className="sr-only">Question {i + 1}: </span>
            {s.question.prompt}
          </p>
          <div className="mt-0.5 flex items-start justify-between gap-2">
            <p className="font-medium text-ink">
              {s.option.label}
              {s.source === "printer" && <span className="block text-xs font-normal text-muted">From your printer&apos;s specifications</span>}
            </p>
            <button
              type="button"
              onClick={() => onChange(s.question.id)}
              disabled={editing === s.question.id}
              aria-label={`Change answer to “${s.question.prompt}”`}
              className="inline-flex shrink-0 items-center gap-1 rounded-sm px-1 py-0.5 text-sm font-medium text-primary-dark hover:underline disabled:text-muted disabled:no-underline"
            >
              <Pencil className="size-3.5" aria-hidden />
              Change
            </button>
          </div>
        </li>
      ))}
    </ol>
  );
}
