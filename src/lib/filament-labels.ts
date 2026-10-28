import type { Filament, Range } from "@/lib/schema";

export const ENCLOSURE_NEED: Record<Filament["enclosure"], string> = {
  "not-needed": "Not needed",
  helpful: "Helpful",
  recommended: "Recommended",
  required: "Required",
};

export const MOISTURE: Record<Filament["moisture"], string> = {
  low: "Low",
  moderate: "Moderate",
  high: "High",
  "very-high": "Very high",
};

export const GROUP: Record<Filament["group"], string> = {
  standard: "Standard",
  engineering: "Engineering",
  flexible: "Flexible",
  reinforced: "Fibre-reinforced",
};

export const range = (r: Range | null, unit: string) => (r ? (r.min === r.max ? `${r.min}${unit}` : `${r.min}–${r.max}${unit}`) : "Not applicable");
