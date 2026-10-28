import Link from "next/link";
import { LinkButton } from "@/components/ui/button";
import { Container } from "@/components/ui/layout";

export default function NotFound() {
  return (
    <Container className="max-w-xl py-16">
      <p className="text-sm font-medium text-muted">Page not found</p>
      <h1 className="mt-1 text-[28px] font-semibold">We couldn&apos;t find that page</h1>
      <p className="mt-3 text-[16px] text-muted">It may have moved, or the printer or guide may not be in the library yet.</p>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <LinkButton href="/diagnose">Diagnose a problem</LinkButton>
        <Link href="/search">Search the site</Link>
      </div>
    </Container>
  );
}
