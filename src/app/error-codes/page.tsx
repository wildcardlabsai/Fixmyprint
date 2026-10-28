import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHeader } from "@/components/ui/layout";
import { getContent } from "@/lib/data/repository";

export const metadata: Metadata = {
  title: "3D printer error messages",
  description: "What common Marlin, Klipper and Prusa firmware error messages mean, and what to check first.",
  alternates: { canonical: "/error-codes" },
};

export default async function ErrorCodesPage() {
  const c = await getContent();
  const groups = [...new Set(c.errorCodes.map((e) => e.firmwareLabel))].map((label) => ({ label, items: c.errorCodes.filter((e) => e.firmwareLabel === label) }));
  return (
    <>
      <PageHeader
        title="Error messages"
        description="Common firmware messages, what they mean and what to check first. Manufacturer builds sometimes word them differently, so search for the key words if yours is not listed exactly."
      />
      <Container className="space-y-8 py-8">
        {groups.map((g) => (
          <section key={g.label} aria-labelledby={`e-${g.label}`}>
            <h2 id={`e-${g.label}`} className="mb-3 text-lg font-semibold">
              {g.label}
            </h2>
            <ul className="divide-y divide-line rounded-lg border border-line bg-surface">
              {g.items.map((e) => (
                <li key={e.slug}>
                  <Link href={`/error-codes/${e.slug}`} className="block px-4 py-3 text-ink no-underline hover:bg-page">
                    <span className="block font-mono text-[15px] font-medium text-primary-dark">{e.message}</span>
                    <span className="block text-sm text-muted">{e.meaning}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
        <p className="text-sm text-muted">
          Is your message missing? <Link href="/contact">Tell us the exact wording</Link> and which printer shows it.
        </p>
      </Container>
    </>
  );
}
