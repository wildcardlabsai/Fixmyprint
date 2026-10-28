"use client";

import { useCallback, useSyncExternalStore } from "react";
import { z } from "zod";

/**
 * Device-only persistence. Everything here lives in this browser's
 * localStorage and is never sent anywhere. Reads are validated so stale or
 * hand-edited values are ignored rather than crashing the page.
 */

const PREFIX = "fmp:";
const EVENT = "fmp:storage";

export const sessionSchema = z.object({
  flowVersion: z.number(),
  printerSlug: z.string().nullable(),
  answers: z.record(z.string(), z.string()),
  tried: z.array(z.string()),
  updatedAt: z.number(),
});
export type StoredSession = z.infer<typeof sessionSchema>;

export const guideProgressSchema = z.object({
  completed: z.array(z.string()),
  hardware: z.string().nullable(),
  result: z.enum(["fixed", "not-fixed"]).nullable(),
  updatedAt: z.number(),
});
export type GuideProgress = z.infer<typeof guideProgressSchema>;

export const historyEntrySchema = z.object({
  guideSlug: z.string(),
  flowId: z.string().nullable(),
  outcomeId: z.string().nullable(),
  printerSlug: z.string().nullable(),
  result: z.enum(["fixed", "not-fixed"]),
  at: z.number(),
});
export type HistoryEntry = z.infer<typeof historyEntrySchema>;

export const keys = {
  printer: `${PREFIX}printer`,
  slicer: `${PREFIX}slicer`,
  session: (flowId: string) => `${PREFIX}session:${flowId}`,
  guide: (slug: string) => `${PREFIX}guide:${slug}`,
  history: `${PREFIX}history`,
};

export function read<T>(key: string, schema: z.ZodType<T>): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return null;
    const parsed = schema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent(EVENT, { detail: key }));
  } catch {
    // Storage full or disabled: the app keeps working without persistence.
  }
}

export function remove(key: string) {
  try {
    window.localStorage.removeItem(key);
    window.dispatchEvent(new CustomEvent(EVENT, { detail: key }));
  } catch {
    // Ignore.
  }
}

/** Lists stored diagnostic sessions, most recent first. */
export function listSessions(): { flowId: string; session: StoredSession }[] {
  try {
    const out: { flowId: string; session: StoredSession }[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (!k?.startsWith(`${PREFIX}session:`)) continue;
      const session = read(k, sessionSchema);
      if (session) out.push({ flowId: k.slice(`${PREFIX}session:`.length), session });
    }
    return out.sort((a, b) => b.session.updatedAt - a.session.updatedAt);
  } catch {
    return [];
  }
}

export function addHistory(entry: HistoryEntry) {
  const list = read(keys.history, z.array(historyEntrySchema)) ?? [];
  write(keys.history, [entry, ...list].slice(0, 50));
}

function subscribe(callback: () => void) {
  const onStorage = () => callback();
  window.addEventListener("storage", onStorage);
  window.addEventListener(EVENT, onStorage);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(EVENT, onStorage);
  };
}

const getString = (key: string) => () => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};
const getSavedPrinter = getString(keys.printer);
const getSavedSlicer = getString(keys.slicer);

function useStoredString(key: string, get: () => string | null): [string | null, (value: string | null) => void] {
  const value = useSyncExternalStore(subscribe, get, () => null);
  const set = useCallback(
    (next: string | null) => {
      try {
        if (next) window.localStorage.setItem(key, next);
        else window.localStorage.removeItem(key);
        window.dispatchEvent(new CustomEvent(EVENT, { detail: key }));
      } catch {
        // Ignore.
      }
    },
    [key],
  );
  return [value, set];
}

/** The printer the user saved as "my printer" on this device. */
export const useSavedPrinter = () => useStoredString(keys.printer, getSavedPrinter);

/** The slicer the user chose on this device, used to show setting names in their slicer. */
export const useSavedSlicer = () => useStoredString(keys.slicer, getSavedSlicer);
