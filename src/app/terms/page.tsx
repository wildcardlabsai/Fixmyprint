import type { Metadata } from "next";
import Link from "next/link";
import { ProsePage } from "@/components/ui/prose-page";

export const metadata: Metadata = {
  title: "Terms of use",
  description: "Terms for using FixMyPrint's troubleshooting tools and guides.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <ProsePage title="Terms of use">
      <section>
        <h2>General guidance</h2>
        <p>
          FixMyPrint provides general troubleshooting guidance for 3D printers. It cannot inspect your printer, and suggestions are based only on the answers you give. Content is provided as-is and may contain mistakes. Always follow your printer manufacturer&apos;s documentation where it differs, and read the <Link href="/safety">safety guidance</Link> before working on a printer.
        </p>
      </section>
      <section>
        <h2>Your responsibility</h2>
        <p>
          You decide whether to carry out any step and are responsible for doing so safely. Do not carry out work you are not confident doing, and never work on mains-powered components. Some repairs or modifications may affect your warranty; check with the manufacturer first.
        </p>
      </section>
      <section>
        <h2>Independence and trademarks</h2>
        <p>FixMyPrint is independent and is not affiliated with or endorsed by any manufacturer. Product and company names are trademarks of their respective owners and are used only for identification.</p>
      </section>
      <section>
        <h2>Corrections</h2>
        <p>
          If you find an error, please <Link href="/contact">report it</Link>.
        </p>
      </section>
    </ProsePage>
  );
}
