import type { Metadata } from "next";
import { SafetyNotices } from "@/components/safety/safety-notices";
import { ProsePage } from "@/components/ui/prose-page";
import { getContent } from "@/lib/data/repository";

export const metadata: Metadata = {
  title: "Safety",
  description: "Safety guidance for working on 3D printers: hot parts, moving parts, electrical hazards, fumes and protective firmware features.",
  alternates: { canonical: "/safety" },
};

export default async function SafetyPage() {
  const c = await getContent();
  return (
    <ProsePage title="Safety" description="3D printers combine hot parts, moving machinery and mains-powered electronics. Please read this before working on one.">
      <section>
        <h2>When to stop and get help</h2>
        <p>Stop using the printer, switch it off at the wall, and contact the manufacturer or a qualified technician if:</p>
        <ul>
          <li>you see smoke, smell burning, or see melted or discoloured connectors or wiring;</li>
          <li>a heater keeps heating when the printer says it is off;</li>
          <li>the fault involves the power supply, mains cable, mains terminals or anything inside the power supply;</li>
          <li>you are not confident carrying out a step safely.</li>
        </ul>
      </section>
      <section>
        <h2>Protective features stay on</h2>
        <p>
          Thermal runaway protection, temperature limits and heating timeouts exist to prevent fires. FixMyPrint will never suggest disabling or weakening them, and you should be wary of any advice that does. If one of these errors appears, it is reporting a real fault to be found and fixed.
        </p>
      </section>
      <section>
        <h2>General precautions</h2>
        <SafetyNotices ids={c.safetyNotices.map((n) => n.id)} notices={c.safetyNotices} />
      </section>
      <section>
        <h2>Unattended printing</h2>
        <p>Do not leave a printer unattended after a heating repair until it has completed several prints without errors. Keep a smoke alarm in the room where you print.</p>
      </section>
    </ProsePage>
  );
}
