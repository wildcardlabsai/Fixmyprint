import type { Metadata } from "next";
import { ProsePage } from "@/components/ui/prose-page";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What FixMyPrint stores on your device, what it sends to the server, and why.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <ProsePage title="Privacy" description="FixMyPrint works without an account and keeps your troubleshooting on your own device.">
      <section>
        <h2>Stored on your device</h2>
        <p>To let you pick up where you left off, this browser&apos;s local storage holds:</p>
        <ul>
          <li>the printer you saved as &ldquo;my printer&rdquo;;</li>
          <li>your answers to each diagnosis you have started;</li>
          <li>which steps you have ticked off in repair guides, and whether a repair worked.</li>
        </ul>
        <p>This information is not sent to us. You can remove it at any time by clearing this site&apos;s data in your browser settings, or by using &ldquo;Start again&rdquo; in a diagnosis.</p>
      </section>
      <section>
        <h2>Sent to the server</h2>
        <ul>
          <li><strong>Searches</strong>: the words you type into search are sent to look up results. They are not linked to you.</li>
          <li>
            <strong>Reports you choose to send</strong>: if you report a wrong diagnosis or use the contact form, we receive your message, the page you were on, and for diagnosis reports your answers and the suggested causes. An email address is included only if you enter one, and is used only to reply.
          </li>
        </ul>
        <p>Like most websites, the hosting provider may keep standard technical logs such as IP addresses for security and reliability.</p>
      </section>
      <section>
        <h2>Cookies and tracking</h2>
        <p>FixMyPrint does not use advertising, tracking or analytics cookies.</p>
      </section>
    </ProsePage>
  );
}
