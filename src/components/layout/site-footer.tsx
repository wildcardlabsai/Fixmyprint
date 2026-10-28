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
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-xs text-sm leading-relaxed text-muted">
            An independent troubleshooting resource. FixMyPrint is not affiliated with or endorsed by any printer manufacturer. Product names belong to their owners.
          </p>
          <p className="max-w-xs text-sm leading-relaxed text-muted">
            Advice is general guidance. Always follow your printer&apos;s documentation and the{" "}
            <Link href="/safety">safety guidance</Link>.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="text-sm font-semibold">{col.title}</h2>
            <ul className="mt-3 space-y-2">
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
