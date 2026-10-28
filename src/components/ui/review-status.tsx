import type { ReviewStatus, Verification } from "@/lib/schema";
import { cn } from "@/lib/cn";

const LABELS: Record<ReviewStatus, { label: string; className: string; description: string }> = {
  draft: { label: "Draft", className: "border-line-strong text-muted", description: "Incomplete and not yet published." },
  unreviewed: {
    label: "Not yet reviewed",
    className: "border-warning/50 bg-warning-50 text-warning-text",
    description: "Written from the sources listed, but not yet checked by a second person. Confirm details against the manufacturer's documentation.",
  },
  reviewed: { label: "Reviewed", className: "border-primary/40 bg-primary-50 text-primary-dark", description: "Checked by an editor against the sources listed." },
  verified: { label: "Verified", className: "border-success/40 bg-success-50 text-success", description: "Checked against primary sources and, where relevant, tested on hardware." },
};

export function ReviewBadge({ status, className }: { status: ReviewStatus; className?: string }) {
  const s = LABELS[status];
  return (
    <span className={cn("inline-flex items-center rounded-sm border px-1.5 py-0.5 text-xs font-medium", s.className, className)}>
      {s.label}
    </span>
  );
}

export function ReviewDetails({ verification, lastVerified }: { verification: Verification; lastVerified?: string | null }) {
  const s = LABELS[verification.status];
  return (
    <div className="space-y-2 text-sm text-muted">
      <p className="flex flex-wrap items-center gap-2">
        <ReviewBadge status={verification.status} />
        <span>{s.description}</span>
      </p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
        <dt>Written by</dt>
        <dd className="text-ink">{verification.author}</dd>
        <dt>Last reviewed</dt>
        <dd className="text-ink">{verification.lastReviewed ? `${verification.lastReviewed}${verification.reviewedBy ? ` by ${verification.reviewedBy}` : ""}` : "Not yet reviewed"}</dd>
        {lastVerified !== undefined && (
          <>
            <dt>Last verified</dt>
            <dd className="text-ink">{lastVerified ?? "Not yet verified"}</dd>
          </>
        )}
      </dl>
      {verification.notes && <p>{verification.notes}</p>}
      {verification.knownLimitations.length > 0 && (
        <div>
          <p className="font-medium text-ink">Known limitations</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5">
            {verification.knownLimitations.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
