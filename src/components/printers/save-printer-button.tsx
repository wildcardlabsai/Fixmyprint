"use client";

import { Bookmark, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSavedPrinter } from "@/lib/client/storage";

export function SavePrinterButton({ slug }: { slug: string }) {
  const [saved, setSaved] = useSavedPrinter();
  const isSaved = saved === slug;
  return (
    <Button variant="secondary" onClick={() => setSaved(isSaved ? null : slug)} aria-pressed={isSaved}>
      {isSaved ? <BookmarkCheck className="text-primary-dark" aria-hidden /> : <Bookmark aria-hidden />}
      {isSaved ? "In my setup" : "Use as my setup"}
    </Button>
  );
}
