"use client";

import { Check } from "lucide-react";
import { SymptomImage } from "@/components/symptoms/symptom-image";
import { cn } from "@/lib/cn";
import type { AnswerOption } from "@/lib/schema";
import { pickImage, type AssetMap } from "@/lib/visual";

interface Props {
  options: AnswerOption[];
  assets: AssetMap;
  selectedOptionId?: string;
  onAnswer: (optionId: string) => void;
}

/**
 * Answer options shown as pictures, so people can compare their print with
 * examples instead of matching technical words. Choosing a picture answers the
 * question straight away, like the text options.
 */
export function VisualComparisonQuestion({ options, assets, selectedOptionId, onAnswer }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {options.map((o) => {
        const selected = o.id === selectedOptionId;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onAnswer(o.id)}
            aria-pressed={selected}
            className={cn(
              "flex h-full flex-col rounded-lg border bg-surface p-2 text-left transition-[border-color,box-shadow]",
              selected ? "border-primary shadow-[0_0_0_1px_var(--color-primary)]" : "border-line-strong hover:border-primary",
            )}
          >
            <SymptomImage asset={pickImage(assets, o.image ? [o.image] : [])} />
            <span className="mt-2 flex items-start gap-2 px-1 pb-1">
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] leading-snug font-medium text-ink">{o.label}</span>
                {o.detail && <span className="mt-0.5 block text-sm text-ink/70">{o.detail}</span>}
              </span>
              <span
                className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2", selected ? "border-primary bg-primary text-white" : "border-line-strong")}
                aria-hidden
              >
                {selected && <Check className="size-3" strokeWidth={3} />}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
