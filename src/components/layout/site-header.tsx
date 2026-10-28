"use client";

import { Menu, Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/brand/logo";
import { LinkButton } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { SetupButton, SetupPanel, type SetupData } from "./setup-panel";
import { SiteSearch } from "./site-search";

/** "Diagnose" is the call-to-action button, so it is not repeated here. */
export const NAV_ITEMS = [
  { href: "/printers", label: "Printer library" },
  { href: "/guides", label: "Repair guides" },
  { href: "/filament", label: "Filament settings" },
  { href: "/slicers", label: "Slicers" },
  { href: "/maintenance", label: "Maintenance" },
];

type Panel = "menu" | "search" | "setup" | null;

export function SiteHeader({ setup }: { setup: SetupData }) {
  const pathname = usePathname();
  const [panel, setPanel] = useState<Panel>(null);
  const toggle = (p: Exclude<Panel, null>) => setPanel((current) => (current === p ? null : p));

  useEffect(() => setPanel(null), [pathname]);
  useEffect(() => {
    if (!panel) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPanel(null);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [panel]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/85">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2 focus:shadow-md">
        Skip to content
      </a>
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6 lg:gap-4">
        <Logo className="shrink-0" />

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-0.5">
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
          <button
            type="button"
            className={cn("hidden size-9 items-center justify-center rounded-md text-ink hover:bg-ink/5 lg:inline-flex", panel === "search" && "bg-ink/5")}
            aria-expanded={panel === "search"}
            aria-controls="search-panel"
            onClick={() => toggle("search")}
          >
            <Search className="size-[18px]" aria-hidden />
            <span className="sr-only">Search</span>
          </button>
          <SetupButton data={setup} open={panel === "setup"} onToggle={() => toggle("setup")} />
          <LinkButton href="/diagnose" size="sm" className="whitespace-nowrap">
            <span className="sm:hidden">Diagnose</span>
            <span className="hidden sm:inline">Start diagnosis</span>
          </LinkButton>
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-md text-ink hover:bg-ink/5 lg:hidden"
            aria-expanded={panel === "menu"}
            aria-controls="mobile-menu"
            onClick={() => toggle("menu")}
          >
            {panel === "menu" ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
            <span className="sr-only">{panel === "menu" ? "Close menu" : "Open menu"}</span>
          </button>
        </div>
      </div>

      {panel === "search" && (
        <div id="search-panel" className="border-t border-line bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
            <SiteSearch autoFocus onNavigate={() => setPanel(null)} />
          </div>
        </div>
      )}

      {panel === "setup" && (
        <div id="setup-panel" role="region" aria-label="My setup" className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-line bg-surface shadow-sm">
          <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
            <SetupPanel data={setup} onDone={() => setPanel(null)} />
          </div>
        </div>
      )}

      {panel === "menu" && (
        <div id="mobile-menu" className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-line bg-surface lg:hidden">
          <div className="mx-auto max-w-6xl space-y-3 px-4 py-4 sm:px-6">
            <SiteSearch onNavigate={() => setPanel(null)} />
            <nav aria-label="Main">
              <ul className="divide-y divide-line">
                {[{ href: "/diagnose", label: "Diagnose a problem" }, ...NAV_ITEMS, { href: "/error-codes", label: "Error messages" }].map((item) => (
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
              </ul>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
