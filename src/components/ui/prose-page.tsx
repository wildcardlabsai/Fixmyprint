import type { ReactNode } from "react";
import { Container, PageHeader } from "./layout";

export function ProsePage({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <Container className="py-8">
        <div className="max-w-2xl space-y-8 text-[16px] leading-relaxed [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-semibold [&_li]:mt-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p+p]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
          {children}
        </div>
      </Container>
    </>
  );
}
