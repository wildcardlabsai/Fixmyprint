import "@fontsource-variable/inter";
import "./globals.css";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getContent } from "@/lib/data/repository";
import { manufacturerOptions, printerOptions, slicerChoicesByPrinter, slicerOptions } from "@/lib/data/view-models";
import { publicEnv, SITE_NAME } from "@/lib/env";

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.siteUrl),
  title: { default: `${SITE_NAME}: 3D printer troubleshooting and repair`, template: `%s | ${SITE_NAME}` },
  description:
    "Find the cause of a 3D printing problem and follow clear steps to fix it. Choose your printer, describe what is happening, and work through it step by step.",
  applicationName: SITE_NAME,
  openGraph: { type: "website", siteName: SITE_NAME, locale: "en_GB" },
  icons: {
    icon: [
      { url: "/brand/icon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const c = await getContent();
  const setup = { printers: printerOptions(c), manufacturers: manufacturerOptions(c), slicers: slicerOptions(c), slicerChoices: slicerChoicesByPrinter(c) };
  return (
    <html lang="en-GB">
      <body className="flex min-h-dvh flex-col">
        <SiteHeader setup={setup} />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
