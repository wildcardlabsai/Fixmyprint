import type { Metadata } from "next";
import Link from "next/link";
import { ProsePage } from "@/components/ui/prose-page";

export const metadata: Metadata = {
  title: "How FixMyPrint works",
  description: "How the diagnostic tool reaches its suggestions, how content is reviewed, and what FixMyPrint is and is not.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <ProsePage title="How FixMyPrint works" description="An independent troubleshooting resource for 3D printers.">
      <section>
        <h2>Independent</h2>
        <p>
          FixMyPrint is not run by, affiliated with or endorsed by any printer or filament manufacturer. Product names are used only to identify the printers they describe and belong to their owners. Where a manufacturer publishes documentation, we link to it, and it takes priority over anything here.
        </p>
      </section>
      <section>
        <h2>How a diagnosis is reached</h2>
        <p>
          Each diagnosis is a written decision tree. Every answer leads to a defined next question, and every answer adds or removes weight from a list of possible causes. A small number of rules also combine answers with your printer&apos;s specifications, for example that ABS on an open-frame printer makes warping more likely.
        </p>
        <p>
          The result is deterministic: the same answers always give the same result. It does not use an AI model. Causes are ranked by their score and shown with one of three labels, <em>Strong match</em>, <em>Likely</em> or <em>Possible</em>, which come from fixed thresholds. They are not statistical probabilities, and we do not show percentages because we have no data that would justify them.
        </p>
        <p>If your answers do not point clearly to any cause, the tool says so and suggests a check that would help, rather than guessing.</p>
      </section>
      <section>
        <h2>Using your printer&apos;s details</h2>
        <p>
          If you choose your printer, questions its recorded specifications already answer, such as how it levels the bed, are filled in and marked as coming from the specifications. You can still change them, for example if you have fitted a different probe. Specifications we have not confirmed are left blank and never guessed, so the tool asks instead.
        </p>
      </section>
      <section>
        <h2>Review status</h2>
        <p>Every printer record, diagnosis, guide and reference entry shows its review status:</p>
        <ul>
          <li><strong>Not yet reviewed</strong>: written from the sources listed but not yet checked by a second person.</li>
          <li><strong>Reviewed</strong>: checked by an editor against the sources listed.</li>
          <li><strong>Verified</strong>: checked against primary sources and, where relevant, tested on hardware.</li>
        </ul>
        <p>
          At the moment all content is <strong>not yet reviewed</strong>. It is written from manufacturer documentation, firmware documentation and widely established practice, but you should confirm details against your printer&apos;s own documentation. Content is never marked as verified simply because it has been published.
        </p>
      </section>
      <section>
        <h2>Corrections</h2>
        <p>
          If something is wrong, incomplete or unsafe, please <Link href="/contact">tell us</Link>. Each diagnosis also has a &ldquo;This diagnosis looks wrong&rdquo; option that sends your answers along with your report.
        </p>
      </section>
      <section>
        <h2>Cost</h2>
        <p>The diagnostic tool, guides and reference pages are free to use and do not need an account.</p>
      </section>
    </ProsePage>
  );
}
