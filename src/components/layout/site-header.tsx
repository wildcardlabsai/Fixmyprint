"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/brand/logo";
import { LinkButton } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { SiteSearch } from "./site-search";

export const NAV_ITEMS = [
  { href: "/diagnose", label: "Diagnose" },
  { href: "/printers", label: "Printer library" },
  { href: "/guides", label: "Repair guides" },
  { href: "/filament", label: "Filament settings" },
  { href: "/maintenance", label: "Maintenance" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/85">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2 focus:shadow-md">
        Skip to content
      </a>
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Logo className="shrink-0" />

        <nav aria-label="Main" className="hidden xl:block">
          <ul className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={cn(
                    "rounded-md px-2.5 py-2 text-sm font-medium whitespace-nowrap no-underline transition-colors",
                    isActive(item.href) ? "text-primary-dark" : "text-ink/80 hover:text-ink",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <SiteSearch className="hidden w-64 md:block xl:w-56 2xl:w-72" />
          <LinkButton href="/diagnose" size="sm" className="whitespace-nowrap">
            <span className="sm:hidden">Diagnose</span>
            <span className="hidden sm:inline">Start diagnosis</span>
          </LinkButton>
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-md text-ink hover:bg-ink/5 xl:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          </button>
        </div>
      </div>

      {open && (
        <div id="mobile-menu" className="border-t border-line bg-surface xl:hidden">
          <div className="mx-auto max-w-6xl space-y-3 px-4 py-4 sm:px-6">
            <SiteSearch className="md:hidden" onNavigate={() => setOpen(false)} />
            <nav aria-label="Main">
              <ul className="divide-y divide-line">
                {NAV_ITEMS.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={isActive(item.href) ? "page" : undefined}
                      className={cn("block py-3 text-[15px] font-medium no-underline", isActive(item.href) ? "text-primary-dark" : "text-ink")}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link href="/error-codes" className="block py-3 text-[15px] font-medium text-ink no-underline">
                    Error messages
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
