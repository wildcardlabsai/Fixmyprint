"use client";

import Link from "next/link";
import { useId, useState } from "react";

export interface CompareSlicer {
  slug: string;
  name: string;
  names: Partial<Record<string, string>>;
}

interface Props {
  slicers: CompareSlicer[];
  rows: { key: string; label: string }[];
}

const NotDocumented = () => <span className="text-muted">Not documented</span>;

/**
 * Setting names side by side. Wide screens get the full table; phones pick
 * two slicers to compare, so nothing needs scrolling sideways.
 */
export function SlicerCompare({ slicers, rows }: Props) {
  const id = useId();
  const [pair, setPair] = useState<[string, string]>([slicers[0]?.slug ?? "", slicers[1]?.slug ?? ""]);
  const chosen = pair.map((slug) => slicers.find((s) => s.slug === slug)).filter((s): s is CompareSlicer => Boolean(s));

  return (
    <>
      <div className="hidden overflow-hidden rounded-lg border border-line bg-surface md:block">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Setting names by slicer</caption>
          <thead className="border-b border-line bg-page/60">
            <tr>
              <th scope="col" className="px-3 py-2.5 font-semibold">
                Setting
              </th>
              {slicers.map((s) => (
                <th key={s.slug} scope="col" className="px-3 py-2.5 font-semibold">
                  <Link href={`/slicers/${s.slug}`}>{s.name}</Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.key}>
                <th scope="row" className="px-3 py-2.5 align-top font-medium">
                  {r.label}
                </th>
                {slicers.map((s) => (
                  <td key={s.slug} className="px-3 py-2.5 align-top">
                    {s.names[r.key] ?? <NotDocumented />}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden">
        <div className="grid grid-cols-2 gap-2">
          {([0, 1] as const).map((i) => (
            <div key={i} className="min-w-0">
              <label htmlFor={`${id}-${i}`} className="text-xs text-muted">
                {i === 0 ? "Compare" : "with"}
              </label>
              <select
                id={`${id}-${i}`}
                value={pair[i]}
                onChange={(e) => setPair((p) => (i === 0 ? [e.target.value, p[1]] : [p[0], e.target.value]))}
                className="mt-1 block w-full rounded-md border border-line-strong bg-surface px-2 py-2 text-sm"
              >
                {slicers.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
        <dl className="mt-3 divide-y divide-line rounded-lg border border-line bg-surface text-sm">
          {rows.map((r) => (
            <div key={r.key} className="px-3 py-2.5">
              <dt className="font-medium">{r.label}</dt>
              <dd className="mt-1 grid grid-cols-2 gap-2">
                {chosen.map((s, i) => (
                  <span key={`${s.slug}-${i}`} className="min-w-0 break-words">
                    {s.names[r.key] ?? <NotDocumented />}
                  </span>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </>
  );
}
