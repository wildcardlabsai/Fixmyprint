import "server-only";
import { cache } from "react";
import { getContent } from "@/lib/data/repository";
import { buildIndex } from "./search";

const indexes = new WeakMap<object, ReturnType<typeof buildIndex>>();

/** Builds the search index once per content snapshot. */
export const getSearchIndex = cache(async () => {
  const content = await getContent();
  let index = indexes.get(content.printers);
  if (!index) {
    index = buildIndex(content);
    indexes.set(content.printers, index);
  }
  return index;
});
