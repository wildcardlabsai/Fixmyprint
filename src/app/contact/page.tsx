import type { Metadata } from "next";
import { FeedbackForm } from "@/components/feedback/feedback-form";
import { ProsePage } from "@/components/ui/prose-page";

export const metadata: Metadata = {
  title: "Contact and corrections",
  description: "Report a mistake, suggest a printer or error message to add, or get in touch.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <ProsePage title="Contact and corrections" description="Report a mistake, suggest a printer or error message to add, or ask a question about the content.">
      <section>
        <p>
          Corrections are especially welcome. Please include the page, what is wrong, and a source such as the manufacturer&apos;s documentation if you have one. We cannot provide individual technical support for a specific printer.
        </p>
      </section>
      <section className="rounded-lg border border-line bg-surface p-4 sm:p-5">
        <FeedbackForm kind="contact" label="Your message" askEmail submitLabel="Send message" />
      </section>
    </ProsePage>
  );
}
