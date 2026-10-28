import { Notice } from "@/components/ui/notice";
import type { SafetyId, SafetyNotice } from "@/lib/schema";

const ORDER: SafetyNotice["level"][] = ["danger", "warning", "caution"];

export function SafetyNotices({ ids, notices, className }: { ids: SafetyId[]; notices: SafetyNotice[]; className?: string }) {
  const list = [...new Set(ids)]
    .map((id) => notices.find((n) => n.id === id))
    .filter((n): n is SafetyNotice => Boolean(n))
    .sort((a, b) => ORDER.indexOf(a.level) - ORDER.indexOf(b.level));
  if (list.length === 0) return null;
  return (
    <div className={className}>
      <ul className="space-y-2">
        {list.map((n) => (
          <li key={n.id}>
            <Notice tone={n.level} title={n.title}>
              {n.body}
            </Notice>
          </li>
        ))}
      </ul>
    </div>
  );
}
