import { vi } from "vitest";

/** Shared mock for next/navigation in component tests. */
export const nav = {
  params: new URLSearchParams(),
  replace: vi.fn(),
  push: vi.fn(),
};

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: nav.replace, push: nav.push, back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/test",
  useSearchParams: () => nav.params,
}));

export function setParams(query: string) {
  nav.params = new URLSearchParams(query);
}
