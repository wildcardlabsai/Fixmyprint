import type { Confidence } from "@/lib/engine/engine";
import { cn } from "@/lib/cn";

export const CONFIDENCE: Record<Confidence, { label: string; description: string; className: string }> = {
  strong: {
    label: "Strong match",
    description: "Your answers point clearly to this cause.",
    className: "border-success/40 bg-success-50 text-success",
  },
  likely: {
    label: "Likely",
    description: "Your answers fit this cause well, but others are possible.",
    className: "border-primary/40 bg-primary-50 text-primary-dark",
  },
  possible: {
    label: "Possible",
    description: "Worth checking, but your answers give limited evidence for it.",
    className: "border-line-strong bg-page text-ink",
  },
};

export function ConfidenceBadge({ confidence, className }: { confidence: Confidence; className?: string }) {
  const c = CONFIDENCE[confidence];
  return <span className={cn("inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-semibold", c.className, className)}>{c.label}</span>;
}
