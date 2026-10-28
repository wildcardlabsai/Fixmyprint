import { CircleAlert, Info, ShieldAlert, TriangleAlert, CircleCheck } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "info" | "caution" | "warning" | "danger" | "success";

const tones: Record<Tone, { box: string; icon: ReactNode; label: string }> = {
  info: { box: "border-line bg-surface", icon: <Info className="text-primary-dark" aria-hidden />, label: "Note" },
  caution: { box: "border-warning/40 bg-warning-50", icon: <TriangleAlert className="text-warning" aria-hidden />, label: "Caution" },
  warning: { box: "border-warning/50 bg-warning-50", icon: <CircleAlert className="text-warning" aria-hidden />, label: "Warning" },
  danger: { box: "border-error/50 bg-error-50", icon: <ShieldAlert className="text-error" aria-hidden />, label: "Danger" },
  success: { box: "border-success/40 bg-success-50", icon: <CircleCheck className="text-success" aria-hidden />, label: "Done" },
};

export function Notice({ tone = "info", title, children, className }: { tone?: Tone; title?: ReactNode; children?: ReactNode; className?: string }) {
  const t = tones[tone];
  return (
    <div className={cn("flex gap-3 rounded-lg border p-3.5 text-sm", t.box, className)} role={tone === "danger" ? "alert" : undefined}>
      <span className="mt-0.5 [&_svg]:size-[18px]">{t.icon}</span>
      <div className="min-w-0 space-y-1">
        {title && (
          <p className="font-semibold text-ink">
            <span className="sr-only">{t.label}: </span>
            {title}
          </p>
        )}
        {children && <div className="leading-relaxed text-ink/90">{children}</div>}
      </div>
    </div>
  );
}
