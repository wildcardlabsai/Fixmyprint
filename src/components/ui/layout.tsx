import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6", className)}>{children}</div>;
}

export function PageHeader({ eyebrow, title, description, children, className }: { eyebrow?: ReactNode; title: ReactNode; description?: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <div className={cn("border-b border-line bg-surface", className)}>
      <Container className="py-8 sm:py-10">
        {eyebrow && <div className="mb-2 text-sm font-medium text-muted">{eyebrow}</div>}
        <h1 className="text-[28px] leading-tight font-semibold sm:text-[32px]">{title}</h1>
        {description && <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-muted">{description}</p>}
        {children && <div className="mt-5">{children}</div>}
      </Container>
    </div>
  );
}

export function SectionHeading({ title, description, action, id }: { title: string; description?: ReactNode; action?: { href: string; label: string }; id?: string }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
      <div>
        <h2 id={id} className="text-xl font-semibold sm:text-[22px]">
          {title}
        </h2>
        {description && <p className="mt-1.5 max-w-2xl text-[15px] text-muted">{description}</p>}
      </div>
      {action && (
        <Link href={action.href} className="inline-flex items-center gap-1 text-sm font-medium no-underline hover:underline">
          {action.label}
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      )}
    </div>
  );
}

export function Breadcrumbs({ items }: { items: { href?: string; label: string }[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-muted">
        {items.map((item, i) => (
          <li key={`${item.label}-${i}`} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="size-3.5" aria-hidden />}
            {item.href ? (
              <Link href={item.href} className="text-muted no-underline hover:text-ink hover:underline">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-ink">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function Panel({ className, children, as: Tag = "div" }: { className?: string; children: ReactNode; as?: "div" | "section" | "article" | "aside" }) {
  return <Tag className={cn("rounded-lg border border-line bg-surface", className)}>{children}</Tag>;
}
