import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { CategoryIcon } from "@/components/icons";
import type { SymptomCategory } from "@/lib/schema";

export function CategoryList({ categories, printerSlug }: { categories: SymptomCategory[]; printerSlug?: string | null }) {
  const suffix = printerSlug ? `?printer=${encodeURIComponent(printerSlug)}` : "";
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
      {categories.map((c) => (
        <li key={c.slug}>
          <Link href={`/problems/${c.slug}${suffix}`} className="group flex items-center gap-3 px-3.5 py-3 text-ink no-underline transition-colors hover:bg-page">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary-50 text-primary-dark">
              <CategoryIcon name={c.icon} className="size-[18px]" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-medium">{c.title}</span>
              <span className="block truncate text-sm text-muted">{c.description}</span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-muted group-hover:text-ink" aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  );
}
