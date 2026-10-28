import Link from "next/link";
import { Logo } from "@/components/brand/logo";

const COLUMNS = [
  {
    title: "Troubleshoot",
    links: [
      { href: "/diagnose", label: "Diagnose a problem" },
      { href: "/error-codes", label: "Error messages" },
      { href: "/guides", label: "Repair guides" },
      { href: "/search", label: "Search" },
    ],
  },
  {
    title: "Reference",
    links: [
      { href: "/printers", label: "Printer library" },
      { href: "/filament", label: "Filament settings" },
      { href: "/slicers", label: "Slicer software" },
      { href: "/maintenance", label: "Maintenance" },
      { href: "/parts", label: "Parts" },
    ],
  },
  {
    title: "About",
    links: [
      { href: "/about", label: "How FixMyPrint works" },
      { href: "/safety", label: "Safety" },
      { href: "/contact", label: "Contact and corrections" },
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line bg-surface">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_repeat(3,1fr)] md:gap-10 md:py-12">
        <div className="col-span-2 space-y-3 md:col-span-1">
          <Logo />
          <p className="max-w-xs text-sm leading-relaxed text-muted">
            An independent troubleshooting resource. FixMyPrint is not affiliated with or endorsed by any printer manufacturer. Product names belong to their owners.
          </p>
          <p className="max-w-xs text-sm leading-relaxed text-muted">
            Advice is general guidance. Always follow your printer&apos;s documentation and the{" "}
            <Link href="/safety">safety guidance</Link>.
          </p>
        </div>
        {COLUMNS.map((col, i) => (
          <nav key={col.title} aria-label={col.title} className={i === COLUMNS.length - 1 ? "col-span-2 md:col-span-1" : undefined}>
            <h2 className="text-sm font-semibold">{col.title}</h2>
            <ul className={i === COLUMNS.length - 1 ? "mt-3 flex flex-wrap gap-x-5 gap-y-2 md:block md:space-y-2" : "mt-3 space-y-2"}>
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-muted no-underline hover:text-ink hover:underline">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
    </footer>
  );
}
