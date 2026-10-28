import { SymptomImage } from "@/components/symptoms/symptom-image";
import { Notice } from "@/components/ui/notice";
import type { GuideStep } from "@/lib/schema";
import { pickImage, type AssetMap } from "@/lib/visual";
import { GuideDiagram } from "./diagrams";

/** One repair step in summary form, with its reference picture or diagram when it has one. */
export function TroubleshootingStep({ step, number, conditional, assets }: { step: GuideStep; number: number; conditional: boolean; assets: AssetMap }) {
  const image = step.image ? pickImage(assets, [step.image]) : null;
  return (
    <li className="flex gap-3">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-line-strong text-sm font-semibold text-primary-dark" aria-hidden>
        {number}
      </span>
      <div className="min-w-0 flex-1">
        {conditional && step.appliesLabel && <p className="text-xs font-semibold tracking-wide text-primary-dark uppercase">{step.appliesLabel} only</p>}
        <h4 className="font-semibold">{step.title}</h4>
        {step.body.map((b) => (
          <p key={b} className="mt-1 text-[15px] leading-relaxed">
            {b}
          </p>
        ))}
        {step.warning && (
          <Notice tone="warning" className="mt-2" title="Warning">
            {step.warning}
          </Notice>
        )}
        {image && <SymptomImage asset={image} credit className="mt-2 max-w-xs" />}
        {step.diagram && <GuideDiagram id={step.diagram} />}
      </div>
    </li>
  );
}
