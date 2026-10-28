import { ExternalLink } from "lucide-react";
import type { SourceReference } from "@/lib/schema";
import { cn } from "@/lib/cn";

export function SourceList({ sources, className }: { sources: SourceReference[]; className?: string }) {
  if (sources.length === 0) return null;
  return (
    <div className={cn("text-sm", className)}>
      <p className="font-medium">Sources</p>
      <ul className="mt-1 space-y-1">
        {sources.map((s) => (
          <li key={s.id} className="text-muted">
            {s.url ? (
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1">
                {s.title}
                <ExternalLink className="size-3" aria-hidden />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            ) : (
              <span className="text-ink">{s.title}</span>
            )}
            {s.note && <span className="block text-xs">{s.note}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
