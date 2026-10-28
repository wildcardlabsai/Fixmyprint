import { Clock, Gauge } from "lucide-react";
import type { Guide } from "@/lib/schema";

export const DIFFICULTY_LABEL: Record<Guide["difficulty"], string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export function formatMinutes(range: Guide["timeMinutes"]): string | null {
  if (!range) return null;
  const fmt = (m: number) => (m >= 60 ? `${Math.round((m / 60) * 10) / 10} h` : `${m} min`);
  return range.min === range.max ? fmt(range.min) : `${fmt(range.min)} to ${fmt(range.max)}`;
}

export function GuideMeta({ guide }: { guide: Guide }) {
  const time = formatMinutes(guide.timeMinutes);
  return (
    <span className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
      <span className="inline-flex items-center gap-1.5">
        <Gauge className="size-4" aria-hidden />
        {DIFFICULTY_LABEL[guide.difficulty]}
      </span>
      {time && (
        <span className="inline-flex items-center gap-1.5">
          <Clock className="size-4" aria-hidden />
          <span>
            <span className="sr-only">Typical time: </span>
            {time}
          </span>
        </span>
      )}
    </span>
  );
}
