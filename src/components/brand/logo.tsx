import Link from "next/link";
import { cn } from "@/lib/cn";

/** The FixMyPrint wordmark. The image is 530 × 96; height is set by the caller. */
export function Logo({ className, imageClassName }: { className?: string; imageClassName?: string }) {
  return (
    <Link href="/" className={cn("inline-flex items-center rounded-sm no-underline", className)}>
      {/* A small, fixed-size PNG: next/image would add nothing here. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/fixmyprint-logo.png" width={530} height={96} alt="FixMyPrint home" className={cn("h-6 w-auto sm:h-7", imageClassName)} />
    </Link>
  );
}
