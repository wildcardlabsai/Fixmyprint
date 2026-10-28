"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/layout";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="max-w-xl py-16">
      <h1 className="text-[28px] font-semibold">Something went wrong</h1>
      <p className="mt-3 text-[16px] text-muted">
        This page could not be loaded. Your saved answers on this device are not affected. Try again, or go back to the home page.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button onClick={reset}>Try again</Button>
        <Link href="/" className="inline-flex h-11 items-center px-2 font-medium">
          Home page
        </Link>
      </div>
    </Container>
  );
}
