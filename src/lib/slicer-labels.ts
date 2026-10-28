import type { Slicer } from "@/lib/schema";

const PLATFORM: Record<Slicer["platforms"][number], string> = { windows: "Windows", macos: "macOS", linux: "Linux" };

export const platformList = (s: Slicer) => (s.platforms.length ? s.platforms.map((p) => PLATFORM[p]).join(", ") : null);

export function openSourceLabel(s: Slicer): string | null {
  if (s.openSource === null) return null;
  if (!s.openSource) return "No";
  return s.licence ? `Yes (${s.licence})` : "Yes";
}
