import Link from "next/link";
import { cn } from "@/lib/cn";

/** Three stacked, slightly offset layers: a print being built up. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-6", className)} aria-hidden focusable="false">
      <rect x="3" y="15.5" width="18" height="4.5" rx="1" fill="#0756B5" />
      <rect x="5" y="9.75" width="15" height="4.5" rx="1" fill="#0878E8" />
      <rect x="7" y="4" width="10" height="4.5" rx="1" fill="#0878E8" opacity="0.55" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2 rounded-sm text-ink no-underline", className)} aria-label="FixMyPrint home">
      <LogoMark />
      <span className="text-[17px] font-semibold tracking-tight">
        FixMy<span className="text-primary-dark">Print</span>
      </span>
    </Link>
  );
}
