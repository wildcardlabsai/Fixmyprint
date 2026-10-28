"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { TYPE_LABELS, type SearchType } from "@/lib/search/search";

interface Hit {
  type: SearchType;
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

/**
 * Global search box with suggestions. Works as a plain GET form to /search when
 * JavaScript is unavailable; with JavaScript it shows live suggestions.
 */
export function SiteSearch({ className, autoFocus, onNavigate }: { className?: string; autoFocus?: boolean; onNavigate?: () => void }) {
  const router = useRouter();
  const listId = useId();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const wrapper = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setHits([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=8`, { signal: controller.signal });
        if (!res.ok) return;
        const data = (await res.json()) as { results: Hit[] };
        setHits(data.results);
        setActive(-1);
      } catch {
        // Aborted or offline: keep the previous suggestions.
      }
    }, 150);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (wrapper.current && !wrapper.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    setQuery("");
    onNavigate?.();
    router.push(href);
  };

  const showList = open && hits.length > 0;

  return (
    <form
      ref={wrapper}
      role="search"
      action="/search"
      className={cn("relative", className)}
      onSubmit={(e) => {
        e.preventDefault();
        if (active >= 0 && hits[active]) go(hits[active].href);
        else if (query.trim()) go(`/search?q=${encodeURIComponent(query.trim())}`);
      }}
    >
      <label htmlFor={`${listId}-input`} className="sr-only">
        Search printers, problems, error messages and guides
      </label>
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
      <input
        id={`${listId}-input`}
        name="q"
        type="search"
        autoComplete="off"
        autoFocus={autoFocus}
        placeholder="Search printers, problems, errors"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (!showList) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((i) => Math.min(i + 1, hits.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => Math.max(i - 1, -1));
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        className="h-10 w-full rounded-md border border-line-strong bg-surface pr-3 pl-9 text-[15px] placeholder:text-muted focus:border-primary focus:outline-none focus-visible:outline-2"
      />
      {showList && (
        <ul id={listId} role="listbox" className="absolute top-full right-0 left-0 z-50 mt-1 max-h-[70vh] overflow-auto rounded-lg border border-line bg-surface py-1 shadow-md">
          {hits.map((h, i) => (
            <li
              key={`${h.type}-${h.id}`}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault();
                go(h.href);
              }}
              onMouseEnter={() => setActive(i)}
              className={cn("cursor-pointer px-3 py-2", i === active && "bg-primary-50")}
            >
              <span className="block text-xs font-medium text-ink/70">{TYPE_LABELS[h.type]}</span>
              <span className="block truncate text-sm font-medium text-ink">{h.title}</span>
            </li>
          ))}
          <li role="option" aria-selected={false} className="border-t border-line px-3 py-2 text-sm">
            <button type="submit" className="font-medium text-primary-dark hover:underline">
              See all results for “{query.trim()}”
            </button>
          </li>
        </ul>
      )}
    </form>
  );
}
